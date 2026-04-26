import type { StockEnAlmacen } from './almacen';

export type EstadoStock = 'OK' | 'BAJO' | 'AGOTADO';

export interface Producto {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  stockPorAlmacen: StockEnAlmacen[];
  precioCompra: number;
  precioVenta: number;
  precioPromedio: number;
  estadoStock: EstadoStock;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductosPage {
  items: Producto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FiltroProductos {
  busqueda?: string;
  categoria?: string;
  estadoStock?: EstadoStock;
  activo?: boolean;
  page?: number;
  pageSize?: number;
}

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
