interface ApolloLikeError {
  graphQLErrors?: { message: string; extensions?: { code?: string } }[];
  message?: string;
}

const errorMessages: Record<string, string> = {
  UNAUTHENTICATED: 'Sesión expirada. Vuelve a iniciar sesión.',
  FORBIDDEN: 'No tienes permisos para esta acción.',
  VALIDATION_ERROR: 'Datos inválidos.',
  NOT_FOUND: 'Recurso no encontrado.',
  DUPLICATE_KEY: 'Ya existe un registro con ese identificador.',
  INSUFFICIENT_STOCK: 'Stock insuficiente para esta operación.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
  BUSINESS_RULE: 'Operación no permitida.',
};

export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  const e = err as ApolloLikeError;
  const gqlErr = e?.graphQLErrors?.[0];
  if (gqlErr) {
    const code = gqlErr.extensions?.code;
    if (code && errorMessages[code]) return errorMessages[code];
    return gqlErr.message;
  }
  return e?.message || fallback;
}

export function getErrorCode(err: unknown): string | undefined {
  const e = err as ApolloLikeError;
  return e?.graphQLErrors?.[0]?.extensions?.code;
}
