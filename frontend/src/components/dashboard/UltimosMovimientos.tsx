'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { MOVIMIENTOS_ULTIMOS } from '../../graphql/reportes';
import type { Movimiento } from '../../types/movimiento';
import { useAlmacen } from '../../lib/almacen-context';
import { TipoBadge } from '../movimientos/TipoBadge';
import { formatDate, formatMoney } from '../../lib/format';

export function UltimosMovimientos({ limite = 8 }: { limite?: number }) {
  const { currentId } = useAlmacen();
  const { data, loading } = useQuery<{ movimientosUltimos: Movimiento[] }>(
    MOVIMIENTOS_ULTIMOS,
    {
      variables: { limite, almacenId: currentId || undefined },
      fetchPolicy: 'cache-and-network',
    },
  );

  const movimientos = data?.movimientosUltimos ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Últimos movimientos
          </h2>
          <p className="text-xs text-slate-500">
            Actividad reciente de inventario.
          </p>
        </div>
        <Link
          href="/movimientos"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Ver todos →
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {loading && movimientos.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ))
        ) : movimientos.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Aún no hay movimientos registrados.
          </div>
        ) : (
          movimientos.map((m) => (
            <Link
              key={m._id}
              href={`/kardex/${m.producto._id}`}
              className="block px-5 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <TipoBadge tipo={m.tipo} />
                  <span className="truncate text-sm font-medium text-slate-900">
                    {m.producto.nombre}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    m.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {m.tipo === 'ENTRADA' ? '+' : '−'}
                  {m.cantidad}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>
                  <code className="font-mono">{m.producto.codigo}</code> ·{' '}
                  <span className="font-mono">{m.almacen.codigo}</span> ·{' '}
                  {m.usuario.nombre}
                </span>
                <span>
                  {formatMoney(m.cantidad * m.precioUnitario)} ·{' '}
                  {formatDate(m.createdAt)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
