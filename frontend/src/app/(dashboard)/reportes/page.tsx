'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  REPORTE_INVENTARIO,
  TOP_PRODUCTOS_MOVIDOS,
  PRODUCTOS_STOCK_BAJO,
} from '../../../graphql/reportes';
import type {
  ReporteInventario,
  ProductoMovido,
} from '../../../types/reporte';
import type { Producto } from '../../../types/producto';
import { formatMoney } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import {
  exportReportesToExcel,
  exportReportesToPDF,
} from '../../../lib/export-reportes';
import { Button } from '../../../components/ui/Button';
import { StockBadge } from '../../../components/ui/StockBadge';
import { MovimientosChart } from '../../../components/dashboard/MovimientosChart';
import { useAlmacen } from '../../../lib/almacen-context';

export default function ReportesPage() {
  const { current, currentId } = useAlmacen();
  const almacenVar = currentId || undefined;

  const { data: invData, loading: invLoading } = useQuery<{
    reporteInventario: ReporteInventario;
  }>(REPORTE_INVENTARIO, {
    variables: { almacenId: almacenVar },
    fetchPolicy: 'cache-and-network',
  });

  const { data: topData, loading: topLoading } = useQuery<{
    topProductosMovidos: ProductoMovido[];
  }>(TOP_PRODUCTOS_MOVIDOS, {
    variables: { limite: 5, dias: 30, almacenId: almacenVar },
    fetchPolicy: 'cache-and-network',
  });

  const { data: bajoData } = useQuery<{
    productosStockBajo: Producto[];
  }>(PRODUCTOS_STOCK_BAJO, {
    variables: { almacenId: almacenVar },
    fetchPolicy: 'cache-and-network',
  });

  const inv = invData?.reporteInventario;
  const top = topData?.topProductosMovidos ?? [];
  const bajo = bajoData?.productosStockBajo ?? [];

  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  const handleExport = (formato: 'xlsx' | 'pdf') => {
    if (!inv) {
      toast.error('Espera a que carguen los datos');
      return;
    }
    setExporting(formato);
    try {
      const payload = { inventario: inv, topMovidos: top, stockBajo: bajo };
      if (formato === 'xlsx') exportReportesToExcel(payload);
      else exportReportesToPDF(payload);
      toast.success(`Reporte exportado a ${formato.toUpperCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al exportar'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reportes
            {current && (
              <span className="ml-2 align-middle text-sm font-medium text-slate-500">
                · {current.codigo}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {current
              ? `Datos del almacén ${current.nombre}.`
              : 'Vista consolidada del inventario, movimientos y productos críticos.'}
          </p>
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
            </svg>
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total productos
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {invLoading && !inv ? '—' : inv?.totalProductos ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Productos activos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Valor total del inventario
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-blue-700">
            {invLoading && !inv ? '—' : formatMoney(inv?.valorTotal ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Suma de stock × precio promedio
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Productos críticos
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
            {bajo.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Stock bajo o agotado</p>
        </div>
      </div>

      <MovimientosChart dias={30} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Inventario por categoría
            </h2>
            <p className="text-xs text-slate-500">
              Distribución de productos y valor por categoría.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Categoría
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-600">
                    Productos
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-600">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invLoading && !inv ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : inv?.porCategoria.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Sin productos.
                    </td>
                  </tr>
                ) : (
                  inv?.porCategoria.map((c) => (
                    <tr key={c.categoria}>
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {c.categoria}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                        {c.cantidadProductos}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-900">
                        {formatMoney(c.valorTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {inv && inv.porCategoria.length > 0 && (
                <tfoot className="bg-slate-50">
                  <tr>
                    <td className="px-4 py-2 font-semibold text-slate-700">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {inv.totalProductos}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-blue-700">
                      {formatMoney(inv.valorTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Top productos más movidos
            </h2>
            <p className="text-xs text-slate-500">
              Últimos 30 días, ordenados por cantidad total movida.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {topLoading && top.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                </div>
              ))
            ) : top.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Sin movimientos en el período.
              </div>
            ) : (
              top.map((t, idx) => (
                <Link
                  key={t.producto._id}
                  href={`/kardex/${t.producto._id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {t.producto.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      <code className="font-mono">{t.producto.codigo}</code> ·{' '}
                      {t.producto.categoria}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {t.totalCantidad} unidades
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.totalMovimientos} movimientos
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Productos con stock bajo
            </h2>
            <p className="text-xs text-slate-500">
              Productos cuyo stock actual es menor o igual al mínimo
              configurado.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            {bajo.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">
                  Código
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">
                  Producto
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">
                  Categoría
                </th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">
                  Stock
                </th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">
                  Mínimo
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bajo.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    ¡Todo en orden! Ningún producto bajo el mínimo.
                  </td>
                </tr>
              ) : (
                bajo.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      <Link
                        href={`/kardex/${p._id}`}
                        className="hover:text-blue-600"
                      >
                        {p.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.categoria}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-900">
                      {p.stock}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                      {p.stockMinimo}
                    </td>
                    <td className="px-4 py-2">
                      <StockBadge estado={p.estadoStock} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
