import Joi from 'joi';
import { ProductoRepository } from '../repositories/ProductoRepository';
import { ProductoDocument, EstadoStock } from '../models/Producto';
import { Page } from '../utils/pagination';
import {
  DuplicateKeyError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';

export interface CrearProductoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
}

export interface ActualizarProductoInput {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  stockMinimo?: number;
  precioCompra?: number;
  precioVenta?: number;
}

export interface ProductoFiltroInput {
  busqueda?: string;
  categoria?: string;
  estadoStock?: EstadoStock;
  activo?: boolean;
  almacenId?: string;
  page?: number;
  pageSize?: number;
}

const crearSchema = Joi.object<CrearProductoInput>({
  codigo: Joi.string().trim().uppercase().min(2).max(50).required(),
  nombre: Joi.string().trim().min(2).max(200).required(),
  descripcion: Joi.string().trim().allow('').max(1000).default(''),
  categoria: Joi.string().trim().min(2).max(100).required(),
  stockMinimo: Joi.number().integer().min(0).required(),
  precioCompra: Joi.number().min(0).required(),
  precioVenta: Joi.number().min(0).required(),
});

const actualizarSchema = Joi.object<ActualizarProductoInput>({
  nombre: Joi.string().trim().min(2).max(200),
  descripcion: Joi.string().trim().allow('').max(1000),
  categoria: Joi.string().trim().min(2).max(100),
  stockMinimo: Joi.number().integer().min(0),
  precioCompra: Joi.number().min(0),
  precioVenta: Joi.number().min(0),
})
  .min(1)
  .messages({ 'object.min': 'Debes enviar al menos un campo a actualizar' });

export class ProductoService {
  constructor(private readonly productoRepo: ProductoRepository) {}

  async crear(input: CrearProductoInput): Promise<ProductoDocument> {
    const { error, value } = crearSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(error.message, error.details);

    const exists = await this.productoRepo.findByCodigo(value.codigo);
    if (exists) throw new DuplicateKeyError('codigo');

    return this.productoRepo.create({
      codigo: value.codigo,
      nombre: value.nombre,
      descripcion: value.descripcion ?? '',
      categoria: value.categoria,
      stockMinimo: value.stockMinimo,
      precioCompra: value.precioCompra,
      precioVenta: value.precioVenta,
      stock: 0,
      precioPromedio: 0,
    });
  }

  async actualizar(
    id: string,
    input: ActualizarProductoInput,
  ): Promise<ProductoDocument> {
    const { error, value } = actualizarSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(error.message, error.details);

    const updated = await this.productoRepo.updateById(id, value);
    if (!updated) throw new NotFoundError('Producto', id);
    return updated;
  }

  async obtener(id: string): Promise<ProductoDocument> {
    const p = await this.productoRepo.findById(id);
    if (!p) throw new NotFoundError('Producto', id);
    return p;
  }

  obtenerPorCodigo(codigo: string): Promise<ProductoDocument | null> {
    return this.productoRepo.findByCodigo(codigo);
  }

  listar(filtro: ProductoFiltroInput): Promise<Page<ProductoDocument>> {
    return this.productoRepo.paginate(
      {
        busqueda: filtro.busqueda,
        categoria: filtro.categoria,
        estadoStock: filtro.estadoStock,
        activo: filtro.activo,
        almacenId: filtro.almacenId,
      },
      filtro.page ?? 1,
      filtro.pageSize ?? 10,
    );
  }

  async eliminar(id: string): Promise<ProductoDocument> {
    const deleted = await this.productoRepo.softDelete(id);
    if (!deleted) throw new NotFoundError('Producto', id);
    return deleted;
  }

  async restaurar(id: string): Promise<ProductoDocument> {
    const restored = await this.productoRepo.restore(id);
    if (!restored) throw new NotFoundError('Producto', id);
    return restored;
  }

  categorias(): Promise<string[]> {
    return this.productoRepo.categorias();
  }

  stockBajo(): Promise<ProductoDocument[]> {
    return this.productoRepo.listStockBajo();
  }
}
