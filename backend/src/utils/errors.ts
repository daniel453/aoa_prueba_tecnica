import { GraphQLError } from 'graphql';

export class AuthenticationError extends GraphQLError {
  constructor(message = 'No autenticado') {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message = 'Acción no autorizada') {
    super(message, {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string, details?: unknown) {
    super(message, {
      extensions: { code: 'VALIDATION_ERROR', http: { status: 400 }, details },
    });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(entidad: string, id?: string) {
    super(`${entidad}${id ? ` con id ${id}` : ''} no encontrado`, {
      extensions: { code: 'NOT_FOUND', http: { status: 404 } },
    });
  }
}

export class DuplicateKeyError extends GraphQLError {
  constructor(campo: string) {
    super(`Ya existe un registro con ese ${campo}`, {
      extensions: { code: 'DUPLICATE_KEY', http: { status: 409 } },
    });
  }
}

export class InsufficientStockError extends GraphQLError {
  constructor(stockActual: number, cantidadSolicitada: number) {
    super(
      `Stock insuficiente. Disponible: ${stockActual}, solicitado: ${cantidadSolicitada}`,
      {
        extensions: {
          code: 'INSUFFICIENT_STOCK',
          http: { status: 409 },
          stockActual,
          cantidadSolicitada,
        },
      },
    );
  }
}

export class InvalidCredentialsError extends GraphQLError {
  constructor() {
    super('Email o contraseña incorrectos', {
      extensions: { code: 'INVALID_CREDENTIALS', http: { status: 401 } },
    });
  }
}

export class BusinessRuleError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'BUSINESS_RULE', http: { status: 422 } },
    });
  }
}
