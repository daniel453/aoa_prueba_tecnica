import mongoose, { Types } from 'mongoose';
import Joi from 'joi';
import { ProductoRepository } from '../repositories/ProductoRepository';
import { AlmacenRepository } from '../repositories/AlmacenRepository';
import {
  MovimientoRepository,
  MovimientoFilter,
} from '../repositories/MovimientoRepository';
import { MovimientoDocument } from '../models/Movimiento';
import { Page } from '../utils/pagination';
import {
  BusinessRuleError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';

export interface RegistrarMovimientoInput {
  productoId: string;
  almacenId: string;
  cantidad: number;
  precioUnitario: number;
  observacion?: string;
}

export interface ListarMovimientosInput extends MovimientoFilter {
  page?: number;
  pageSize?: number;
}

const inputSchema = Joi.object<RegistrarMovimientoInput>({
  productoId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'productoId no es un ObjectId valido',
    'string.length': 'productoId no es un ObjectId valido',
  }),
  almacenId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'almacenId no es un ObjectId valido',
    'string.length': 'almacenId no es un ObjectId valido',
  }),
  cantidad: Joi.number().integer().min(1).required(),
  precioUnitario: Joi.number().min(0).required(),
  observacion: Joi.string().trim().allow('').max(500).default(''),
});

export class MovimientoService {
  constructor(
    private readonly productoRepo: ProductoRepository,
    private readonly movimientoRepo: MovimientoRepository,
    private readonly almacenRepo: AlmacenRepository,
  ) {}

  /**
   * Calcula el nuevo precio promedio ponderado tras una entrada.
   *
   * Formula:
   *   nuevo = (stockActual * precioActual + cantidad * precioEntrada)
   *           / (stockActual + cantidad)
   *
   * Caso especial: si stockActual === 0, el promedio se reinicia al precio
   * de entrada (evita division por cero y refleja que se "reinicia" el lote).
   *
   * Es estatica para poder probarla sin instanciar el servicio.
   */
  static calcularPrecioPromedio(
    stockActual: number,
    precioPromedioActual: number,
    cantidadEntrada: number,
    precioEntrada: number,
  ): number {
    if (stockActual === 0) return precioEntrada;
    const valorActual = stockActual * precioPromedioActual;
    const valorEntrada = cantidadEntrada * precioEntrada;
    return (valorActual + valorEntrada) / (stockActual + cantidadEntrada);
  }

  async registrarEntrada(
    input: RegistrarMovimientoInput,
    usuarioId: string,
  ): Promise<MovimientoDocument> {
    const value = this.validarInput(input);
    const movimientoId = await this.ejecutarMovimientoEnTransaccion(
      'ENTRADA',
      value,
      usuarioId,
    );
    return this.fetchOrThrow(movimientoId);
  }

  async registrarSalida(
    input: RegistrarMovimientoInput,
    usuarioId: string,
  ): Promise<MovimientoDocument> {
    const value = this.validarInput(input);
    const movimientoId = await this.ejecutarMovimientoEnTransaccion(
      'SALIDA',
      value,
      usuarioId,
    );
    return this.fetchOrThrow(movimientoId);
  }

  async obtener(id: string): Promise<MovimientoDocument> {
    const m = await this.movimientoRepo.findById(id);
    if (!m) throw new NotFoundError('Movimiento', id);
    return m;
  }

  listar(filtro: ListarMovimientosInput): Promise<Page<MovimientoDocument>> {
    return this.movimientoRepo.paginate(
      {
        productoId: filtro.productoId,
        almacenId: filtro.almacenId,
        tipo: filtro.tipo,
        desde: filtro.desde,
        hasta: filtro.hasta,
      },
      filtro.page ?? 1,
      filtro.pageSize ?? 20,
    );
  }

  async kardexPorProducto(
    productoId: string,
    desde?: Date,
    hasta?: Date,
    almacenId?: string,
  ): Promise<MovimientoDocument[]> {
    if (!Types.ObjectId.isValid(productoId)) {
      throw new ValidationError('productoId no es un ObjectId valido');
    }
    const producto = await this.productoRepo.findById(productoId);
    if (!producto) throw new NotFoundError('Producto', productoId);
    return this.movimientoRepo.findByProducto(
      productoId,
      desde,
      hasta,
      almacenId,
    );
  }

  // -- helpers privados --

  private validarInput(input: RegistrarMovimientoInput): RegistrarMovimientoInput {
    const { error, value } = inputSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(error.message, error.details);
    return value;
  }

  /**
   * Ejecuta el movimiento (entrada o salida) dentro de una transaccion Mongo.
   * Garantiza que actualizar el stock del producto y crear el registro de
   * kardex sucedan atomicamente: si algo falla, se hace rollback completo.
   */
  private async ejecutarMovimientoEnTransaccion(
    tipo: 'ENTRADA' | 'SALIDA',
    input: RegistrarMovimientoInput,
    usuarioId: string,
  ): Promise<string> {
    const session = await mongoose.startSession();
    let movimientoId: string | null = null;

    try {
      await session.withTransaction(async () => {
        const producto = await this.productoRepo.findById(
          input.productoId,
          session,
        );
        if (!producto) {
          throw new NotFoundError('Producto', input.productoId);
        }
        if (!producto.activo) {
          throw new BusinessRuleError(
            'No se pueden registrar movimientos sobre productos inactivos',
          );
        }

        const almacen = await this.almacenRepo.findById(
          input.almacenId,
          session,
        );
        if (!almacen) {
          throw new NotFoundError('Almacen', input.almacenId);
        }
        if (!almacen.activo) {
          throw new BusinessRuleError(
            'No se pueden registrar movimientos sobre almacenes inactivos',
          );
        }

        // stockAntes es del ALMACEN especifico, no del global
        const stockAntes = ProductoRepository.stockEnAlmacen(
          producto,
          input.almacenId,
        );
        let stockDespues: number;
        const update: {
          almacenId: string;
          nuevoStockEnAlmacen: number;
          precioPromedio?: number;
          precioCompra?: number;
        } = {
          almacenId: input.almacenId,
          nuevoStockEnAlmacen: 0,
        };

        if (tipo === 'ENTRADA') {
          stockDespues = stockAntes + input.cantidad;
          update.nuevoStockEnAlmacen = stockDespues;
          // El precio promedio se calcula sobre el stock GLOBAL del producto
          // (no por almacen) porque el costo del inventario se considera unificado.
          update.precioPromedio = MovimientoService.calcularPrecioPromedio(
            producto.stock,
            producto.precioPromedio,
            input.cantidad,
            input.precioUnitario,
          );
          update.precioCompra = input.precioUnitario;
        } else {
          if (stockAntes < input.cantidad) {
            throw new InsufficientStockError(stockAntes, input.cantidad);
          }
          stockDespues = stockAntes - input.cantidad;
          update.nuevoStockEnAlmacen = stockDespues;
        }

        await this.productoRepo.updateStockAndPrice(
          producto._id.toString(),
          update,
          session,
        );

        const created = await this.movimientoRepo.create(
          {
            producto: producto._id,
            almacen: almacen._id,
            tipo,
            cantidad: input.cantidad,
            precioUnitario: input.precioUnitario,
            stockAntes,
            stockDespues,
            observacion: input.observacion ?? '',
            usuario: usuarioId,
          },
          session,
        );

        movimientoId = created._id.toString();
      });
    } finally {
      session.endSession();
    }

    if (!movimientoId) {
      // No deberia pasar: withTransaction lanza si falla, pero TS no lo sabe.
      throw new Error('La transaccion no asigno el id del movimiento creado');
    }
    return movimientoId;
  }

  private async fetchOrThrow(id: string): Promise<MovimientoDocument> {
    const found = await this.movimientoRepo.findById(id);
    if (!found) {
      throw new Error(
        `Movimiento ${id} se creo pero no se pudo recuperar para devolver`,
      );
    }
    return found;
  }
}
