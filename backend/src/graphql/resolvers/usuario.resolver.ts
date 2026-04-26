import { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../../utils/authGuards';
import { CrearUsuarioInput } from '../../services/AuthService';

export const usuarioResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      const auth = requireAuth(ctx);
      return ctx.repositories.usuario.findById(auth.id);
    },
  },

  Mutation: {
    autenticarUsuario: (
      _parent: unknown,
      args: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      return ctx.services.auth.login(args.email, args.password);
    },

    crearUsuario: (
      _parent: unknown,
      args: { input: CrearUsuarioInput },
      ctx: GraphQLContext,
    ) => {
      requireRole(ctx, ['ADMIN']);
      return ctx.services.auth.crearUsuario(args.input);
    },
  },
};
