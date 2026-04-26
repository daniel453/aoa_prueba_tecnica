import { scalarsResolvers } from './scalars.resolver';
import { usuarioResolvers } from './usuario.resolver';
import { almacenResolvers } from './almacen.resolver';
import { productoResolvers } from './producto.resolver';
import { movimientoResolvers } from './movimiento.resolver';
import { reporteResolvers } from './reporte.resolver';

export const resolvers = {
  ...scalarsResolvers,
  Producto: productoResolvers.Producto,
  Query: {
    _service: () => 'inventario-kardex',
    ...usuarioResolvers.Query,
    ...almacenResolvers.Query,
    ...productoResolvers.Query,
    ...movimientoResolvers.Query,
    ...reporteResolvers.Query,
  },
  Mutation: {
    ...usuarioResolvers.Mutation,
    ...almacenResolvers.Mutation,
    ...productoResolvers.Mutation,
    ...movimientoResolvers.Mutation,
  },
};
