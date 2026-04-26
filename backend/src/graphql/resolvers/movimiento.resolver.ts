import { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../../utils/authGuards';
import {
  RegistrarMovimientoInput,
  ListarMovimientosInput,
} from '../../services/MovimientoService';

export const movimientoResolvers = {
  Query: {
    movimientos: (
      _parent: unknown,
      args: { filtro?: ListarMovimientosInput },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.movimiento.listar(args.filtro ?? {});
    },

    movimiento: (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.movimiento.obtener(args.id);
    },

    kardexProducto: (
      _parent: unknown,
      args: {
        productoId: string;
        desde?: Date;
        hasta?: Date;
        almacenId?: string;
      },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.movimiento.kardexPorProducto(
        args.productoId,
        args.desde,
        args.hasta,
        args.almacenId,
      );
    },
  },

  Mutation: {
    registrarEntrada: (
      _parent: unknown,
      args: { input: RegistrarMovimientoInput },
      ctx: GraphQLContext,
    ) => {
      const auth = requireRole(ctx, ['ADMIN', 'OPERADOR']);
      return ctx.services.movimiento.registrarEntrada(args.input, auth.id);
    },

    registrarSalida: (
      _parent: unknown,
      args: { input: RegistrarMovimientoInput },
      ctx: GraphQLContext,
    ) => {
      const auth = requireRole(ctx, ['ADMIN', 'OPERADOR']);
      return ctx.services.movimiento.registrarSalida(args.input, auth.id);
    },
  },
};
