import type { TipoMovimiento } from '../../types/movimiento';

const styles: Record<TipoMovimiento, { label: string; classes: string }> = {
  ENTRADA: {
    label: 'Entrada',
    classes: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  SALIDA: {
    label: 'Salida',
    classes: 'bg-red-50 text-red-700 ring-red-600/20',
  },
};

export function TipoBadge({ tipo }: { tipo: TipoMovimiento }) {
  const { label, classes } = styles[tipo];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      <span aria-hidden="true">{tipo === 'ENTRADA' ? '↓' : '↑'}</span>
      {label}
    </span>
  );
}
