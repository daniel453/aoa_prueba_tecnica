import type { EstadoStock } from '../../types/producto';

const styles: Record<EstadoStock, { label: string; classes: string }> = {
  OK: {
    label: 'OK',
    classes: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  BAJO: {
    label: 'Stock bajo',
    classes: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  },
  AGOTADO: {
    label: 'Agotado',
    classes: 'bg-red-50 text-red-700 ring-red-600/20',
  },
};

export function StockBadge({ estado }: { estado: EstadoStock }) {
  const { label, classes } = styles[estado];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {label}
    </span>
  );
}
