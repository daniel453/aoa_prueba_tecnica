'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { PRODUCTOS_STOCK_BAJO } from '../../graphql/reportes';
import type { Producto } from '../../types/producto';
import { useAlmacen } from '../../lib/almacen-context';
import { StockBadge } from '../ui/StockBadge';

export function StockBajoList() {
  const { current, currentId } = useAlmacen();
  const { data, loading } = useQuery<{ productosStockBajo: Producto[] }>(
    PRODUCTOS_STOCK_BAJO,
    {
      variables: { almacenId: currentId || undefined },
      fetchPolicy: 'cache-and-network',
    },
  );

  const productos = data?.productosStockBajo ?? [];

  // Cuando hay almacen seleccionado, mostramos el stock de ese almacen
  // (subdoc) en lugar del global.
  const stockEnAlmacen = (p: Producto): number => {
    if (!currentId) return p.stock;
    return (
      p.stockPorAlmacen.find((s) => s.almacen._id === currentId)?.stock ?? 0
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Productos con stock bajo
          </h2>
          <p className="text-xs text-slate-500">
            {current
              ? `Stock en ${current.codigo} <= mínimo.`
              : 'Stock global menor o igual al mínimo configurado.'}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          {productos.length}
        </span>
      </div>

      <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {loading && productos.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            </div>
          ))
        ) : productos.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            ¡Todo en orden! Ningún producto bajo el mínimo.
          </div>
        ) : (
          productos.map((p) => (
            <Link
              key={p._id}
              href={`/kardex/${p._id}`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {p.nombre}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  <code className="font-mono">{p.codigo}</code> · stock{' '}
                  <span className="font-semibold text-slate-700">
                    {stockEnAlmacen(p)}
                  </span>{' '}
                  / min {p.stockMinimo}
                </p>
              </div>
              <StockBadge estado={p.estadoStock} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
