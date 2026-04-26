import { ProductoRepository } from '../repositories/ProductoRepository';
import { MovimientoRepository } from '../repositories/MovimientoRepository';
import { ProductoDocument } from '../models/Producto';
import { MovimientoDocument } from '../models/Movimiento';

export interface DashboardMetrics {
  totalProductos: number;
  productosStockBajo: number;
  productosAgotados: number;
  valorInventario: number;
  movimientosHoy: number;
}

export interface MovimientoAgrupado {
  fecha: string; // YYYY-MM-DD
  entradas: number;
  salidas: number;
}

export interface CategoriaResumen {
  categoria: string;
  cantidadProductos: number;
  valorTotal: number;
}

export interface ReporteInventario {
  totalProductos: number;
  valorTotal: number;
  porCategoria: CategoriaResumen[];
}

export interface ProductoMovido {
  producto: unknown;
  totalMovimientos: number;
  totalCantidad: number;
}

/**
 * Servicio de agregaciones para el dashboard y la pagina de reportes.
 *
 * Convencion de scoping:
 *   - totalProductos siempre es global (es el catalogo del sistema).
 *   - El resto de metricas (stock bajo/agotado, valor, movimientos hoy, etc.)
 *     respeta `almacenId` cuando se proporciona.
 */
export class ReporteService {
  constructor(
    private readonly productoRepo: ProductoRepository,
    private readonly movimientoRepo: MovimientoRepository,
  ) {}

  async dashboardMetrics(almacenId?: string): Promise<DashboardMetrics> {
    const [
      totalProductos,
      productosStockBajo,
      productosAgotados,
      valorInventario,
      movimientosHoy,
    ] = await Promise.all([
      this.productoRepo.countActive(),
      this.productoRepo.countByEstadoStock('BAJO', almacenId),
      this.productoRepo.countByEstadoStock('AGOTADO', almacenId),
      this.productoRepo.sumValorInventario(almacenId),
      this.movimientoRepo.countToday(almacenId),
    ]);
    return {
      totalProductos,
      productosStockBajo,
      productosAgotados,
      valorInventario,
      movimientosHoy,
    };
  }

  movimientosPorDia(
    dias = 30,
    almacenId?: string,
  ): Promise<MovimientoAgrupado[]> {
    return this.movimientoRepo.aggregateByDay(dias, almacenId);
  }

  productosStockBajo(almacenId?: string): Promise<ProductoDocument[]> {
    return this.productoRepo.listStockBajo(almacenId);
  }

  movimientosUltimos(
    limite = 10,
    almacenId?: string,
  ): Promise<MovimientoDocument[]> {
    return this.movimientoRepo.findRecent(limite, almacenId);
  }

  topProductosMovidos(
    limite = 5,
    dias = 30,
    almacenId?: string,
  ): Promise<ProductoMovido[]> {
    return this.movimientoRepo.topMovidos(limite, dias, almacenId) as Promise<
      ProductoMovido[]
    >;
  }

  async reporteInventario(almacenId?: string): Promise<ReporteInventario> {
    const [totalProductos, valorTotal, porCategoria] = await Promise.all([
      this.productoRepo.countActive(),
      this.productoRepo.sumValorInventario(almacenId),
      this.productoRepo.resumenPorCategoria(almacenId),
    ]);
    return { totalProductos, valorTotal, porCategoria };
  }
}
