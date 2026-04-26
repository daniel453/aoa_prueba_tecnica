import { GraphQLContext, AuthenticatedUser } from '../graphql/context';
import { AuthenticationError, ForbiddenError } from './errors';
import { Rol } from '../models/Usuario';

/**
 * Garantiza que hay un usuario autenticado en el contexto.
 * Lanza AuthenticationError si no lo hay.
 */
export function requireAuth(ctx: GraphQLContext): AuthenticatedUser {
  if (!ctx.user) {
    throw new AuthenticationError();
  }
  return ctx.user;
}

/**
 * Garantiza que el usuario autenticado tiene uno de los roles permitidos.
 * Implica requireAuth.
 */
export function requireRole(ctx: GraphQLContext, roles: Rol[]): AuthenticatedUser {
  const user = requireAuth(ctx);
  if (!roles.includes(user.rol)) {
    throw new ForbiddenError(
      `Esta accion requiere alguno de los roles: ${roles.join(', ')}`,
    );
  }
  return user;
}
