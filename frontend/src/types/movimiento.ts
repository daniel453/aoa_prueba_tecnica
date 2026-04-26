import type { Producto } from './producto';
import type { Almacen } from './almacen';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface UsuarioRef {
  _id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'OPERADOR';
}

export interface Movimiento {
  _id: string;
  producto: Producto;
  almacen: Almacen;
  tipo: TipoMovimiento;
  cantidad: number;
  precioUnitario: number;
  stockAntes: number;
  stockDespues: number;
  observacion: string;
  usuario: UsuarioRef;
  createdAt: string;
}

export interface MovimientosPage {
  items: Movimiento[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FiltroMovimientos {
  productoId?: string;
  almacenId?: string;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

export interface RegistrarMovimientoInput {
  productoId: string;
  almacenId: string;
  cantidad: number;
  precioUnitario: number;
  observacion?: string;
}
