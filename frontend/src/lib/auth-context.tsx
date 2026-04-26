'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client';
import { AUTENTICAR_USUARIO, ME } from '../graphql/auth';
import { TOKEN_STORAGE_KEY } from './apollo';

export type Rol = 'ADMIN' | 'OPERADOR';

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const apollo = useApolloClient();

  const [autenticar] = useMutation(AUTENTICAR_USUARIO);
  const [fetchMe] = useLazyQuery(ME, { fetchPolicy: 'network-only' });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ data, error }) => {
        if (error || !data?.me) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setUsuario(null);
        } else {
          setUsuario(data.me);
        }
      })
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<Usuario> => {
      const { data } = await autenticar({ variables: { email, password } });
      const payload = data?.autenticarUsuario;
      if (!payload?.token) {
        throw new Error('No se recibió token del servidor');
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
      setUsuario(payload.usuario);
      return payload.usuario;
    },
    [autenticar],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUsuario(null);
    apollo.clearStore();
  }, [apollo]);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
