'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApolloClient, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { OBTENER_PRODUCTO } from '../../../../graphql/productos';
import { useAlmacen } from '../../../../lib/almacen-context';
import {
  KARDEX_PRODUCTO,
  LISTAR_MOVIMIENTOS,
} from '../../../../graphql/movimientos';
import type { Producto } from '../../../../types/producto';
import type {
  Movimiento,
  MovimientosPage,
  TipoMovimiento,
} from '../../../../types/movimiento';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { StockBadge } from '../../../../components/ui/StockBadge';
import { Barcode } from '../../../../components/productos/Barcode';
import { HistorialPreciosChart } from '../../../../components/productos/HistorialPreciosChart';
import { TipoBadge } from '../../../../components/movimientos/TipoBadge';
import { formatDate, formatMoney } from '../../../../lib/format';
import { getErrorMessage } from '../../../../lib/errors';
import {
  exportKardexToExcel,
  exportKardexToPDF,
} from '../../../../lib/export-kardex';

const PAGE_SIZE = 20;

interface KardexPageProps {
  params: Promise<{ id: string }>;
}

export default function KardexPage({ params }: KardexPageProps) {
  const { id } = use(params);
  const apollo = useApolloClient();
  const { currentId: almacenContextId } = useAlmacen();

  const [tipo, setTipo] = useState<TipoMovimiento | ''>('');
  const [almacenId, setAlmacenId] = useState<string>(almacenContextId);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  // Sigue al switcher global
  useEffect(() => {
    setAlmacenId(almacenContextId);
    setPage(1);
  }, [almacenContextId]);

  const { data: productoData, loading: prodLoading } = useQuery<{
    producto: Producto | null;
  }>(OBTENER_PRODUCTO, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: movsData,
    loading: movsLoading,
    error: movsError,
  } = useQuery<{ movimientos: MovimientosPage }>(LISTAR_MOVIMIENTOS, {
    variables: {
      filtro: {
        productoId: id,
        almacenId: almacenId || undefined,
        tipo: tipo || undefined,
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
    setDesde('');
    setHasta('');
    setPage(1);
  };

  const handleExport = async (formato: 'xlsx' | 'pdf') => {
    if (!productoData?.producto) return;
    setExporting(formato);
    try {
      const { data: kardexData } = await apollo.query<{
        kardexProducto: Movimiento[];
      }>({
        query: KARDEX_PRODUCTO,
        variables: {
          productoId: id,
          almacenId: almacenId || undefined,
          desde: desde ? new Date(desde).toISOString() : undefined,
          hasta: hasta ? new Date(`${hasta}T23:59:59`).toISOString() : undefined,
        },
        fetchPolicy: 'network-only',
      });
      let kardex = kardexData.kardexProducto;
      if (tipo) kardex = kardex.filter((m) => m.tipo === tipo);

      if (kardex.length === 0) {
        toast.error('No hay movimientos para exportar con los filtros actuales');
        return;
      }

      const payload = { producto: productoData.producto, movimientos: kardex };
      if (formato === 'xlsx') exportKardexToExcel(payload);
      else exportKardexToPDF(payload);
      toast.success(`Kardex exportado a ${formato.toUpperCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al exportar'));
    } finally {
      setExporting(null);
    }
  };

  if (prodLoading && !productoData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <svg
            className="h-5 w-5 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Cargando…
        </div>
      </div>
    );
  }

  if (!productoData?.producto) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Producto no encontrado.
      </div>
    );
  }

  const producto = productoData.producto;
  const movimientos = movsData?.movimientos.items ?? [];
  const total = movsData?.movimientos.total ?? 0;
  const totalPages = movsData?.movimientos.totalPages ?? 1;

  const valorInventario = producto.stock * producto.precioPromedio;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/productos" className="hover:text-slate-900">
          Productos
        </Link>
        <span>/</span>
        <span className="text-slate-900">Kardex</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {producto.nombre}
              </h1>
              <StockBadge estado={producto.estadoStock} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
                {producto.codigo}
              </code>
              <span>{producto.categoria}</span>
              {producto.descripcion && (
                <>
                  <span>·</span>
                  <span>{producto.descripcion}</span>
                </>
              )}
            </div>
            <div className="mt-3 inline-block rounded-md border border-slate-200 bg-white p-2">
              <Barcode
                value={producto.codigo}
                height={42}
                fontSize={11}
                printableLabel={`${producto.codigo} - ${producto.nombre}`}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={exporting === 'xlsx'}
              disabled={exporting !== null}
              onClick={() => handleExport('xlsx')}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M8 13l4 4 4-4M12 17V9" />
              </svg>
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={exporting === 'pdf'}
              disabled={exporting !== null}
              onClick={() => handleExport('pdf')}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
                <text x="7" y="18" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none">PDF</text>
              </svg>
              PDF
            </Button>
            <Link href={`/productos/${producto._id}/editar`}>
              <Button variant="secondary" size="sm">
                Editar
              </Button>
            </Link>
            <Link href={`/movimientos/salida?productoId=${producto._id}`}>
              <Button variant="secondary" size="sm">
                Nueva salida
              </Button>
            </Link>
            <Link href={`/movimientos/entrada?productoId=${producto._id}`}>
              <Button size="sm">Nueva entrada</Button>
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Stock actual
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {producto.stock}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Stock mínimo
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-700">
              {producto.stockMinimo}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Precio promedio
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-700">
              {formatMoney(producto.precioPromedio)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Precio venta
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-700">
              {formatMoney(producto.precioVenta)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Valor inventario
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-blue-700">
              {formatMoney(valorInventario)}
            </dd>
          </div>
        </dl>
      </div>

      <HistorialPreciosChart productoId={id} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
        {(tipo || desde || hasta) && (
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
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Stock antes
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Stock después
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Precio
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Usuario / Obs.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movsLoading && movimientos.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : movsError ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-red-600"
                  >
                    {getErrorMessage(movsError, 'Error cargando kardex')}
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Sin movimientos registrados para este producto.
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
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {m.stockAntes}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          m.tipo === 'ENTRADA'
                            ? 'font-semibold text-green-700'
                            : 'font-semibold text-red-700'
                        }
                      >
                        {m.tipo === 'ENTRADA' ? '+' : '−'}
                        {m.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                      {m.stockDespues}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatMoney(m.precioUnitario)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                      {formatMoney(m.cantidad * m.precioUnitario)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="font-medium text-slate-700">
                        {m.usuario.nombre}
                      </div>
                      {m.observacion && (
                        <div className="mt-0.5 text-slate-500">
                          {m.observacion}
                        </div>
                      )}
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
              de <span className="font-medium text-slate-900">{total}</span>{' '}
              movimientos
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
