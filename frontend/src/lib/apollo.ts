import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

export const TOKEN_STORAGE_KEY = 'inv_kardex_token';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem(TOKEN_STORAGE_KEY)
      : null;
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

interface NetworkErrorWithResult {
  result?: {
    errors?: { message: string; extensions?: { code?: string } }[];
  };
}

/**
 * Recolecta los GraphQL errors disponibles, ya sea en graphQLErrors top-level
 * o anidados dentro de networkError.result (cuando el backend tipa errores
 * con http.status 4xx/5xx — caso comun: 409 DUPLICATE_KEY, 401 UNAUTHENTICATED).
 */
function collectErrors(
  graphQLErrors: ReadonlyArray<{ message: string; extensions?: Record<string, unknown> }> | undefined,
  networkError: NetworkErrorWithResult | Error | null | undefined,
): { message: string; code?: string }[] {
  const out: { message: string; code?: string }[] = [];
  if (graphQLErrors) {
    for (const e of graphQLErrors) {
      out.push({ message: e.message, code: e.extensions?.code as string | undefined });
    }
  }
  const nested = (networkError as NetworkErrorWithResult | null | undefined)
    ?.result?.errors;
  if (nested) {
    for (const e of nested) {
      out.push({ message: e.message, code: e.extensions?.code });
    }
  }
  return out;
}

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const all = collectErrors(graphQLErrors, networkError);

  for (const { message, code } of all) {
    if (
      code === 'UNAUTHENTICATED' &&
      typeof window !== 'undefined' &&
      operation.operationName !== 'Me' &&
      operation.operationName !== 'AutenticarUsuario'
    ) {
      const had = localStorage.getItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (had && window.location.pathname !== '/login') {
        window.location.assign('/login?reason=expired');
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error(`[GraphQL]: ${message} (${code ?? '-'})`);
    }
  }

  // networkError sin result.errors = fallo de red real (sin respuesta del server)
  const nestedErrors = (networkError as NetworkErrorWithResult | null | undefined)
    ?.result?.errors;
  if (
    networkError &&
    !nestedErrors?.length &&
    process.env.NODE_ENV !== 'production'
  ) {
    console.error('[Network]:', networkError);
  }
});

export function createApolloClient() {
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}
