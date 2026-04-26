interface ApolloLikeError {
  graphQLErrors?: { message: string; extensions?: { code?: string } }[];
  networkError?: { message?: string } | null;
  message?: string;
}

/**
 * Mensajes propios para codes donde el backend devuelve algo tecnico
 * o ambiguo. Para los demas codes preferimos el mensaje del backend
 * porque suele ser mas especifico (ej. "Ya existe un registro con ese
 * codigo" vs un generico "duplicado").
 */
const messageOverrides: Record<string, string> = {
  UNAUTHENTICATED: 'Sesión expirada. Vuelve a iniciar sesión.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
};

export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  const e = err as ApolloLikeError;
  const gqlErr = e?.graphQLErrors?.[0];

  if (gqlErr) {
    const code = gqlErr.extensions?.code;
    // Si tenemos override propio para este code, usarlo
    if (code && messageOverrides[code]) return messageOverrides[code];
    // Si no, preferir el mensaje del backend (suele ser especifico)
    if (gqlErr.message) return gqlErr.message;
  }

  if (e?.networkError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }

  return e?.message || fallback;
}

export function getErrorCode(err: unknown): string | undefined {
  const e = err as ApolloLikeError;
  return e?.graphQLErrors?.[0]?.extensions?.code;
}

/**
 * Devuelve TODOS los mensajes de error de la respuesta (no solo el primero).
 * Util cuando el backend devuelve multiples errores de validacion.
 */
export function getAllErrorMessages(err: unknown): string[] {
  const e = err as ApolloLikeError;
  if (!e?.graphQLErrors?.length) {
    const single = getErrorMessage(err);
    return single ? [single] : [];
  }
  return e.graphQLErrors.map((g) => {
    const code = g.extensions?.code;
    if (code && messageOverrides[code]) return messageOverrides[code];
    return g.message;
  });
}
