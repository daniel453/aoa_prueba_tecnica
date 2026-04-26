import { GraphQLFormattedError } from 'graphql';
import { env } from '../config/env';

/**
 * Formatea cada error que sale de Apollo. Mantiene el codigo en
 * extensions.code para que el frontend pueda actuar; oculta el stacktrace
 * en produccion.
 */
export function formatError(formatted: GraphQLFormattedError): GraphQLFormattedError {
  const code =
    (formatted.extensions?.code as string | undefined) ?? 'INTERNAL_SERVER_ERROR';

  // En desarrollo: dejamos pasar todo (incluye stacktrace)
  if (!env.isProduction) {
    return {
      ...formatted,
      extensions: { ...formatted.extensions, code },
    };
  }

  // En produccion: ocultamos stacktrace y solo dejamos campos relevantes
  return {
    message: formatted.message,
    path: formatted.path,
    locations: formatted.locations,
    extensions: {
      code,
      ...(formatted.extensions?.details
        ? { details: formatted.extensions.details }
        : {}),
    },
  };
}
