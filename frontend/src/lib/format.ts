// COP no usa decimales en uso diario. minimumFractionDigits:0 mantiene
// limpio el display ("$ 1.500") y maximumFractionDigits:2 deja que se
// vean decimales si por alguna razon estan guardados (ej. precio promedio
// ponderado calculado).
const moneyFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateOnlyFmt = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
});

export const formatMoney = (n: number) => moneyFmt.format(n);
export const formatDate = (d: string | Date) => dateFmt.format(new Date(d));
export const formatDateOnly = (d: string | Date) =>
  dateOnlyFmt.format(new Date(d));
