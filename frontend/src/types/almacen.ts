export interface Almacen {
  _id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockEnAlmacen {
  almacen: Almacen;
  stock: number;
  stockMinimo: number;
}

export interface CrearAlmacenInput {
  codigo: string;
  nombre: string;
  direccion?: string;
}

export interface ActualizarAlmacenInput {
  nombre?: string;
  direccion?: string;
}
