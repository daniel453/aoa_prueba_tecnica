'use client';

import { ApolloProvider } from '@apollo/client';
import { useMemo, type ReactNode } from 'react';
import { createApolloClient } from './apollo';

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createApolloClient(), []);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
