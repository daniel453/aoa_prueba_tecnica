interface GqlErrorShape {
  message: string;
  extensions?: { code?: string };
}

interface ApolloLikeError {
  graphQLErrors?: GqlErrorShape[];
  /**
   * networkError aparece cuando Apollo Client recibe HTTP 4xx/5xx aunque
   * el body sea un response GraphQL valido (caso tipico: el backend tipa
   * sus errores con `http: { status: 409 }`). En ese caso `result.errors`
   * trae los errores GraphQL reales.
   */
  networkError?: {
    message?: string;
    statusCode?: number;
    result?: { errors?: GqlErrorShape[] };
  } | null;
  message?: string;
}

const messageOverrides: Record<string, string> = {
  UNAUTHENTICATED: 'Sesión expirada. Vuelve a iniciar sesión.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
};

/** Combina graphQLErrors top-level + los embebidos en networkError.result. */
function collectGqlErrors(err: ApolloLikeError): GqlErrorShape[] {
  const list: GqlErrorShape[] = [];
  if (err?.graphQLErrors?.length) list.push(...err.graphQLErrors);
  const nested = err?.networkError?.result?.errors;
  if (nested?.length) list.push(...nested);
  return list;
}

function pickMessage(g: GqlErrorShape): string {
  const code = g.extensions?.code;
  if (code && messageOverrides[code]) return messageOverrides[code];
  return g.message;
}

export function getErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error',
): string {
  const e = err as ApolloLikeError;
  const all = collectGqlErrors(e);
  if (all.length > 0) return pickMessage(all[0]);

  // Solo aqui es realmente "no hay conexion / server caido / DNS fail"
  if (e?.networkError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }

  return e?.message || fallback;
}

export function getErrorCode(err: unknown): string | undefined {
  const e = err as ApolloLikeError;
  const all = collectGqlErrors(e);
  return all[0]?.extensions?.code;
}

/**
 * Devuelve TODOS los mensajes de error de la respuesta (no solo el primero).
 * Util cuando el backend devuelve multiples errores de validacion.
 */
export function getAllErrorMessages(err: unknown): string[] {
  const e = err as ApolloLikeError;
  const all = collectGqlErrors(e);
  if (all.length > 0) return all.map(pickMessage);
  return [getErrorMessage(err)];
}
