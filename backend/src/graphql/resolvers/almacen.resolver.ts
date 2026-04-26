import { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../../utils/authGuards';

export const almacenResolvers = {
  Query: {
    almacenes: (
      _p: unknown,
      args: { activo?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.almacen.list(args.activo);
    },

    almacen: (_p: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return ctx.services.almacen.obtener(args.id);
    },
  },

  Mutation: {
    crearAlmacen: (
      _p: unknown,
      args: {
        input: { codigo: string; nombre: string; direccion?: string };
      },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.almacen.crear(args.input);
    },

    actualizarAlmacen: (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.almacen.actualizar(args.id, args.input);
    },

    eliminarAlmacen: (
      _p: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.almacen.eliminar(args.id);
    },

    restaurarAlmacen: (
      _p: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.almacen.restaurar(args.id);
    },
  },
};
