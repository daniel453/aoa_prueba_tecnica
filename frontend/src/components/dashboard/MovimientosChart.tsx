'use client';

import { useQuery } from '@apollo/client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MOVIMIENTOS_POR_DIA } from '../../graphql/reportes';
import type { MovimientoAgrupado } from '../../types/reporte';
import { useAlmacen } from '../../lib/almacen-context';

interface MovimientosChartProps {
  dias?: number;
}

function formatDateLabel(fecha: string): string {
  const [, m, d] = fecha.split('-');
  return `${d}/${m}`;
}

export function MovimientosChart({ dias = 30 }: MovimientosChartProps) {
  const { currentId } = useAlmacen();
  const { data, loading, error } = useQuery<{
    movimientosPorDia: MovimientoAgrupado[];
  }>(MOVIMIENTOS_POR_DIA, {
    variables: { dias, almacenId: currentId || undefined },
    fetchPolicy: 'cache-and-network',
  });

  const items = (data?.movimientosPorDia ?? []).map((d) => ({
    ...d,
    label: formatDateLabel(d.fecha),
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Entradas vs salidas
          </h2>
          <p className="text-xs text-slate-500">
            Últimos {dias} días, agrupados por día.
          </p>
        </div>
      </div>

      <div className="mt-4 h-72">
        {loading && items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Cargando…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">
            Error cargando gráfico
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin movimientos en el rango.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={items}
              margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar
                dataKey="entradas"
                name="Entradas"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="salidas"
                name="Salidas"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
