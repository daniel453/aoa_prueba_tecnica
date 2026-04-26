'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { LISTAR_MOVIMIENTOS } from '../../../graphql/movimientos';
import type {
  MovimientosPage,
  TipoMovimiento,
} from '../../../types/movimiento';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { TipoBadge } from '../../../components/movimientos/TipoBadge';
import { AlmacenSelector } from '../../../components/almacenes/AlmacenSelector';
import { formatDate, formatMoney } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import { useAlmacen } from '../../../lib/almacen-context';

const PAGE_SIZE = 15;

export default function MovimientosPage() {
  const { currentId: almacenContextId } = useAlmacen();
  const [tipo, setTipo] = useState<TipoMovimiento | ''>('');
  // Scope inicial = el almacen del context (selector del topbar).
  // El usuario puede sobreescribirlo con el filtro de la pagina.
  const [almacenId, setAlmacenId] = useState<string>(almacenContextId);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);

  // Si cambia el switcher del topbar, actualizamos el filtro de la pagina
  useEffect(() => {
    setAlmacenId(almacenContextId);
    setPage(1);
  }, [almacenContextId]);

  const { data, loading, error } = useQuery<{
    movimientos: MovimientosPage;
  }>(LISTAR_MOVIMIENTOS, {
    variables: {
      filtro: {
        tipo: tipo || undefined,
        almacenId: almacenId || undefined,
        desde: desde ? new Date(desde).toISOString() : undefined,
        hasta: hasta
          ? new Date(`${hasta}T23:59:59`).toISOString()
          : undefined,
        page,
        pageSize: PAGE_SIZE,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const handleResetFiltros = () => {
    setTipo('');
    setAlmacenId('');
    setDesde('');
    setHasta('');
    setPage(1);
  };

  const movimientos = data?.movimientos.items ?? [];
  const total = data?.movimientos.total ?? 0;
  const totalPages = data?.movimientos.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Movimientos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Historial completo de entradas y salidas del inventario.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/movimientos/entrada">
            <Button variant="secondary">
              <svg
                className="h-4 w-4 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Entrada
            </Button>
          </Link>
          <Link href="/movimientos/salida">
            <Button variant="secondary">
              <svg
                className="h-4 w-4 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              Salida
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Select
            label="Tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoMovimiento | '');
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </Select>
          <AlmacenSelector
            value={almacenId}
            onChange={(id) => {
              setAlmacenId(id);
              setPage(1);
            }}
            allowAll
          />
          <Input
            label="Desde"
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(tipo || almacenId || desde || hasta) && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleResetFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Producto
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Almacén
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Precio
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Stock
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && movimientos.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-red-600"
                  >
                    {getErrorMessage(error, 'Error cargando movimientos')}
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No hay movimientos registrados con esos filtros.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={m.tipo} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/kardex/${m.producto._id}`}
                        className="flex flex-col hover:text-blue-600"
                      >
                        <span className="font-medium text-slate-900">
                          {m.producto.nombre}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          {m.producto.codigo}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {m.almacen.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          m.tipo === 'ENTRADA'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }
                      >
                        {m.tipo === 'ENTRADA' ? '+' : '−'}
                        {m.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatMoney(m.precioUnitario)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      <span className="tabular-nums">{m.stockAntes}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {m.stockDespues}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.usuario.nombre}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-600">
              Mostrando{' '}
              <span className="font-medium text-slate-900">
                {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, total)}
              </span>{' '}
              de <span className="font-medium text-slate-900">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-slate-600">
                Página <span className="font-medium">{page}</span> /{' '}
                {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
