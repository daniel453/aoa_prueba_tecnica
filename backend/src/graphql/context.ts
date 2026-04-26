import { Request } from 'express';
import { verifyToken } from '../utils/jwt';
import { Container } from '../container';
import { Rol } from '../models/Usuario';

export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: Rol;
}

export interface GraphQLContext {
  user: AuthenticatedUser | null;
  services: Container['services'];
  repositories: Container['repositories'];
}

/**
 * Construye el context para cada request GraphQL.
 * Si el header Authorization viene con un Bearer token valido, popula `user`.
 * Si el token es invalido, `user` queda en null y los resolvers protegidos
 * lanzaran AuthenticationError mediante requireAuth().
 */
export function buildContext(container: Container) {
  return async ({ req }: { req: Request }): Promise<GraphQLContext> => {
    let user: AuthenticatedUser | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = verifyToken(token);
        user = {
          id: payload.sub,
          email: payload.email,
          rol: payload.rol,
        };
      } catch {
        // Token invalido o expirado: el resolver decidira si requiere auth
      }
    }

    return {
      user,
      services: container.services,
      repositories: container.repositories,
    };
  };
}
