import { GraphQLContext } from '../context';
import { requireAuth } from '../../utils/authGuards';

export const reporteResolvers = {
  Query: {
    dashboardMetrics: (
      _p: unknown,
      args: { almacenId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.reporte.dashboardMetrics(args.almacenId);
    },

    movimientosUltimos: (
      _p: unknown,
      args: { limite?: number; almacenId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.reporte.movimientosUltimos(
        args.limite ?? 10,
        args.almacenId,
      );
    },

    movimientosPorDia: (
      _p: unknown,
      args: { dias?: number; almacenId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.reporte.movimientosPorDia(
        args.dias ?? 30,
        args.almacenId,
      );
    },

    productosStockBajo: (
      _p: unknown,
      args: { almacenId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.reporte.productosStockBajo(args.almacenId);
    },

    topProductosMovidos: (
      _p: unknown,
      args: { limite?: number; dias?: number; almacenId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.reporte.topProductosMovidos(
        args.limite ?? 5,
        args.dias ?? 30,
        args.almacenId,
      );
    },

    reporteInventario: (
      _p: unknown,
      args: { almacenId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return ctx.services.reporte.reporteInventario(args.almacenId);
    },
  },
};
