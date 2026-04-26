'use client';

import { useQuery } from '@apollo/client';
import { DASHBOARD_METRICS } from '../../../graphql/reportes';
import type { DashboardMetrics } from '../../../types/reporte';
import { useAuth } from '../../../lib/auth-context';
import { useAlmacen } from '../../../lib/almacen-context';
import { formatMoney } from '../../../lib/format';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import { MovimientosChart } from '../../../components/dashboard/MovimientosChart';
import { StockBajoList } from '../../../components/dashboard/StockBajoList';
import { UltimosMovimientos } from '../../../components/dashboard/UltimosMovimientos';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const { current, currentId } = useAlmacen();
  const { data, loading } = useQuery<{
    dashboardMetrics: DashboardMetrics;
  }>(DASHBOARD_METRICS, {
    variables: { almacenId: currentId || undefined },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60_000,
  });

  const m = data?.dashboardMetrics;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hola {usuario?.nombre}, este es el resumen actual del inventario
          {current ? (
            <>
              {' en '}
              <span className="font-semibold text-slate-700">
                {current.codigo}
              </span>
              .
            </>
          ) : (
            ' (todos los almacenes).'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total productos"
          value={m?.totalProductos ?? 0}
          loading={loading && !m}
          tone="blue"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
            </svg>
          }
        />
        <MetricCard
          label="Stock bajo"
          value={m?.productosStockBajo ?? 0}
          hint="Por debajo del mínimo"
          loading={loading && !m}
          tone="amber"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
            </svg>
          }
        />
        <MetricCard
          label="Agotados"
          value={m?.productosAgotados ?? 0}
          hint="Stock = 0"
          loading={loading && !m}
          tone="red"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M4.93 4.93l14.14 14.14" />
            </svg>
          }
        />
        <MetricCard
          label="Valor inventario"
          value={m ? formatMoney(m.valorInventario) : '—'}
          hint="Stock × precio promedio"
          loading={loading && !m}
          tone="green"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <MetricCard
          label="Movimientos hoy"
          value={m?.movimientosHoy ?? 0}
          loading={loading && !m}
          tone="slate"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17l5-5 5 5M7 7l5 5 5-5" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MovimientosChart dias={30} />
        </div>
        <StockBajoList />
      </div>

      <UltimosMovimientos limite={8} />
    </div>
  );
}
