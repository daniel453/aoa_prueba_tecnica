'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { LISTAR_PRODUCTOS } from '../../graphql/productos';
import type { Producto, ProductosPage } from '../../types/producto';
import { useDebounce } from '../../lib/useDebounce';
import { StockBadge } from '../ui/StockBadge';

interface ProductoSelectorProps {
  value: Producto | null;
  onChange: (producto: Producto | null) => void;
  /** Si true, los productos AGOTADO se muestran deshabilitados */
  disableAgotados?: boolean;
  error?: string;
}

export function ProductoSelector({
  value,
  onChange,
  disableAgotados = false,
  error,
}: ProductoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [busquedaInput, setBusquedaInput] = useState('');
  const busqueda = useDebounce(busquedaInput, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery<{ productos: ProductosPage }>(
    LISTAR_PRODUCTOS,
    {
      variables: {
        filtro: {
          busqueda: busqueda || undefined,
          activo: true,
          page: 1,
          pageSize: 20,
        },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const productos = useMemo(() => data?.productos.items ?? [], [data]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleSelect = (p: Producto) => {
    onChange(p);
    setOpen(false);
    setBusquedaInput('');
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-slate-700">Producto</label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                {value.codigo}
              </code>
              <span className="truncate text-slate-900">{value.nombre}</span>
              <span className="text-xs text-slate-500">
                · stock {value.stock}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">Selecciona un producto…</span>
          )}
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 p-2">
              <input
                type="search"
                autoFocus
                placeholder="Buscar por código o nombre…"
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto p-1">
              {loading && productos.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Cargando…
                </div>
              ) : productos.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Sin resultados.
                </div>
              ) : (
                productos.map((p) => {
                  const disabled =
                    disableAgotados && p.estadoStock === 'AGOTADO';
                  return (
                    <button
                      type="button"
                      key={p._id}
                      disabled={disabled}
                      onClick={() => !disabled && handleSelect(p)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${
                        disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-slate-50'
                      } ${value?._id === p._id ? 'bg-blue-50' : ''}`}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2 truncate">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                            {p.codigo}
                          </code>
                          <span className="truncate font-medium text-slate-900">
                            {p.nombre}
                          </span>
                        </span>
                        <span className="mt-0.5 text-xs text-slate-500">
                          {p.categoria} · stock{' '}
                          <span className="font-semibold text-slate-700">
                            {p.stock}
                          </span>{' '}
                          / min {p.stockMinimo}
                        </span>
                      </span>
                      <StockBadge estado={p.estadoStock} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
