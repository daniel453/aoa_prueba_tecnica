import { baseTypeDefs } from './base';
import { usuarioTypeDefs } from './usuario';
import { almacenTypeDefs } from './almacen';
import { productoTypeDefs } from './producto';
import { movimientoTypeDefs } from './movimiento';
import { reporteTypeDefs } from './reporte';

export const typeDefs = [
  baseTypeDefs,
  usuarioTypeDefs,
  almacenTypeDefs,
  productoTypeDefs,
  movimientoTypeDefs,
  reporteTypeDefs,
];
