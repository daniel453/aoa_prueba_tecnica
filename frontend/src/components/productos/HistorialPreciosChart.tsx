'use client';

import { useQuery } from '@apollo/client';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KARDEX_PRODUCTO } from '../../graphql/movimientos';
import type { Movimiento } from '../../types/movimiento';
import { formatMoney } from '../../lib/format';

interface HistorialPreciosChartProps {
  productoId: string;
}

interface PuntoPrecio {
  fecha: string;
  fechaCorta: string;
  precio: number;
}

function buildSerie(movimientos: Movimiento[]): PuntoPrecio[] {
  // Solo entradas (precios de compra reales)
  return movimientos
    .filter((m) => m.tipo === 'ENTRADA')
    .map((m) => {
      const d = new Date(m.createdAt);
      return {
        fecha: m.createdAt,
        fechaCorta: `${String(d.getDate()).padStart(2, '0')}/${String(
          d.getMonth() + 1,
        ).padStart(2, '0')}`,
        precio: m.precioUnitario,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function HistorialPreciosChart({ productoId }: HistorialPreciosChartProps) {
  const { data, loading } = useQuery<{ kardexProducto: Movimiento[] }>(
    KARDEX_PRODUCTO,
    {
      variables: { productoId },
      fetchPolicy: 'cache-and-network',
    },
  );

  const serie = data ? buildSerie(data.kardexProducto) : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Historial de precios de compra
        </h2>
        <p className="text-xs text-slate-500">
          Precio unitario de cada entrada registrada para este producto.
        </p>
      </div>

      <div className="mt-4 h-56">
        {loading && serie.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Cargando…
          </div>
        ) : serie.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Aún no hay entradas registradas para graficar.
          </div>
        ) : serie.length === 1 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
            <span>Solo hay una entrada registrada:</span>
            <span className="text-base font-semibold text-slate-900">
              {formatMoney(serie[0].precio)}
            </span>
            <span className="text-xs text-slate-400">
              ({serie[0].fechaCorta})
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={serie}
              margin={{ top: 5, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="fechaCorta"
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v: number) => formatMoney(v)}
              />
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="precio"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
                name="Precio compra"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
