import { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../../utils/authGuards';
import { calcularEstadoStock, ProductoDocument } from '../../models/Producto';
import {
  CrearProductoInput,
  ActualizarProductoInput,
  ProductoFiltroInput,
} from '../../services/ProductoService';

export const productoResolvers = {
  Producto: {
    /**
     * Campo derivado: se computa a partir de stock y stockMinimo en cada query.
     * Asi mantenemos una sola fuente de verdad y evitamos virtuales con
     * problemas de tipo en Mongoose.
     */
    estadoStock: (parent: ProductoDocument) =>
      calcularEstadoStock(parent.stock, parent.stockMinimo),
  },

  Query: {
    productos: (
      _parent: unknown,
      args: { filtro?: ProductoFiltroInput },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.producto.listar(args.filtro ?? {});
    },

    producto: (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.producto.obtener(args.id);
    },

    productoPorCodigo: (
      _parent: unknown,
      args: { codigo: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.producto.obtenerPorCodigo(args.codigo);
    },

    categorias: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return ctx.services.producto.categorias();
    },
  },

  Mutation: {
    crearProducto: (
      _parent: unknown,
      args: { input: CrearProductoInput },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN', 'OPERADOR']);
      return ctx.services.producto.crear(args.input);
    },

    actualizarProducto: (
      _parent: unknown,
      args: { id: string; input: ActualizarProductoInput },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN', 'OPERADOR']);
      return ctx.services.producto.actualizar(args.id, args.input);
    },

    eliminarProducto: (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.producto.eliminar(args.id);
    },

    restaurarProducto: (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.producto.restaurar(args.id);
    },
  },
};
