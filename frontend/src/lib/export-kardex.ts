import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Producto } from '../types/producto';
import type { Movimiento } from '../types/movimiento';
import { formatDate, formatMoney } from './format';

interface ExportData {
  producto: Producto;
  movimientos: Movimiento[];
}

function buildFilename(producto: Producto, ext: string): string {
  const safe = producto.codigo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const stamp = new Date().toISOString().slice(0, 10);
  return `kardex_${safe}_${stamp}.${ext}`;
}

export function exportKardexToExcel({ producto, movimientos }: ExportData): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen del producto
  const resumen = [
    ['Kardex'],
    [],
    ['Producto', producto.nombre],
    ['Código', producto.codigo],
    ['Categoría', producto.categoria],
    ['Stock actual', producto.stock],
    ['Stock mínimo', producto.stockMinimo],
    ['Precio compra', producto.precioCompra],
    ['Precio venta', producto.precioVenta],
    ['Precio promedio', producto.precioPromedio],
    ['Valor inventario', producto.stock * producto.precioPromedio],
    ['Generado', new Date().toLocaleString('es-CO')],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
  wsResumen['!cols'] = [{ wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Hoja 2: Movimientos
  const headers = [
    'Fecha',
    'Tipo',
    'Cantidad',
    'Stock antes',
    'Stock después',
    'Precio unitario',
    'Total',
    'Usuario',
    'Observación',
  ];
  const rows = movimientos.map((m) => [
    new Date(m.createdAt).toLocaleString('es-CO'),
    m.tipo,
    m.cantidad,
    m.stockAntes,
    m.stockDespues,
    m.precioUnitario,
    m.cantidad * m.precioUnitario,
    m.usuario.nombre,
    m.observacion,
  ]);
  const wsMovs = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsMovs['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMovs, 'Movimientos');

  XLSX.writeFile(wb, buildFilename(producto, 'xlsx'));
}

export function exportKardexToPDF({ producto, movimientos }: ExportData): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Kardex', 40, 40);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${producto.nombre}`, 40, 60);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Código: ${producto.codigo}  ·  Categoría: ${producto.categoria}`,
    40,
    74,
  );
  doc.text(
    `Generado: ${new Date().toLocaleString('es-CO')}`,
    pageWidth - 40,
    40,
    { align: 'right' },
  );

  // Cuadro de métricas
  doc.setFontSize(9);
  doc.setTextColor(40);
  const metrics = [
    `Stock actual: ${producto.stock}`,
    `Mínimo: ${producto.stockMinimo}`,
    `Precio promedio: ${formatMoney(producto.precioPromedio)}`,
    `Valor inv.: ${formatMoney(producto.stock * producto.precioPromedio)}`,
  ];
  doc.text(metrics.join('   |   '), 40, 95);

  autoTable(doc, {
    startY: 110,
    head: [
      [
        'Fecha',
        'Tipo',
        'Stock antes',
        'Cantidad',
        'Stock después',
        'Precio',
        'Total',
        'Usuario',
        'Obs.',
      ],
    ],
    body: movimientos.map((m) => [
      formatDate(m.createdAt),
      m.tipo,
      String(m.stockAntes),
      `${m.tipo === 'ENTRADA' ? '+' : '-'}${m.cantidad}`,
      String(m.stockDespues),
      formatMoney(m.precioUnitario),
      formatMoney(m.cantidad * m.precioUnitario),
      m.usuario.nombre,
      m.observacion,
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index === 1) {
        const v = data.cell.raw as string;
        data.cell.styles.textColor = v === 'ENTRADA' ? [22, 163, 74] : [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(buildFilename(producto, 'pdf'));
}
