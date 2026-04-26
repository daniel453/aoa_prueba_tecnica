import type { Producto } from './producto';

export interface DashboardMetrics {
  totalProductos: number;
  productosStockBajo: number;
  productosAgotados: number;
  valorInventario: number;
  movimientosHoy: number;
}

export interface MovimientoAgrupado {
  fecha: string;
  entradas: number;
  salidas: number;
}

export interface ProductoMovido {
  producto: Producto;
  totalMovimientos: number;
  totalCantidad: number;
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
