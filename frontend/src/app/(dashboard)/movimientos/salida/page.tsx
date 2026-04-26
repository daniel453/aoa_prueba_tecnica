'use client';

import Link from 'next/link';
import { MovimientoFormPage } from '../../../../components/movimientos/MovimientoFormPage';

export default function SalidaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/movimientos" className="hover:text-slate-900">
          Movimientos
        </Link>
        <span>/</span>
        <span className="text-slate-900">Salida</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Registrar salida
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Disminuye el stock del producto. No se permite stock negativo.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <MovimientoFormPage tipo="SALIDA" />
      </div>
    </div>
  );
}
