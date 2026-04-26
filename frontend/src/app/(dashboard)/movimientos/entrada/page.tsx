'use client';

import Link from 'next/link';
import { MovimientoFormPage } from '../../../../components/movimientos/MovimientoFormPage';

export default function EntradaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/movimientos" className="hover:text-slate-900">
          Movimientos
        </Link>
        <span>/</span>
        <span className="text-slate-900">Entrada</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Registrar entrada
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aumenta el stock del producto y recalcula el precio promedio
          ponderado.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <MovimientoFormPage tipo="ENTRADA" />
      </div>
    </div>
  );
}
