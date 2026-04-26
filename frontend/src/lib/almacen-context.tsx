'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@apollo/client';
import { LISTAR_ALMACENES } from '../graphql/almacenes';
import type { Almacen } from '../types/almacen';

const STORAGE_KEY = 'inv_kardex_almacen';

interface AlmacenContextValue {
  /** Lista de almacenes activos cargada del backend */
  almacenes: Almacen[];
  /** El almacen actualmente seleccionado, o null si esta en modo "Todos" */
  current: Almacen | null;
  /** ID del almacen actual o '' si "Todos" - listo para pasar a queries */
  currentId: string;
  setCurrent: (almacenId: string | null) => void;
  loading: boolean;
}

const AlmacenContext = createContext<AlmacenContextValue | undefined>(undefined);

export function AlmacenProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  const { data, loading } = useQuery<{ almacenes: Almacen[] }>(
    LISTAR_ALMACENES,
    {
      variables: { activo: true },
      fetchPolicy: 'cache-and-network',
    },
  );

  const almacenes = useMemo(() => data?.almacenes ?? [], [data]);

  // Hidratacion desde localStorage al montar (cliente)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCurrentId(saved);
    setHydrated(true);
  }, []);

  // Si el almacen guardado ya no existe (eliminado), limpiamos
  useEffect(() => {
    if (!hydrated || !currentId || almacenes.length === 0) return;
    const exists = almacenes.some((a) => a._id === currentId);
    if (!exists) {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentId('');
    }
  }, [hydrated, currentId, almacenes]);

  const setCurrent = useCallback((almacenId: string | null) => {
    if (almacenId) {
      localStorage.setItem(STORAGE_KEY, almacenId);
      setCurrentId(almacenId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentId('');
    }
  }, []);

  const current = currentId
    ? (almacenes.find((a) => a._id === currentId) ?? null)
    : null;

  return (
    <AlmacenContext.Provider
      value={{ almacenes, current, currentId, setCurrent, loading }}
    >
      {children}
    </AlmacenContext.Provider>
  );
}

export function useAlmacen(): AlmacenContextValue {
  const ctx = useContext(AlmacenContext);
  if (!ctx) {
    throw new Error('useAlmacen debe usarse dentro de AlmacenProvider');
  }
  return ctx;
}
