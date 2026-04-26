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

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const { message, extensions } of graphQLErrors) {
      const code = extensions?.code as string | undefined;

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
  }
  if (networkError && process.env.NODE_ENV !== 'production') {
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
