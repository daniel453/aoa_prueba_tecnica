import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type {
  ProductoMovido,
  ReporteInventario,
} from '../types/reporte';
import type { Producto } from '../types/producto';
import { formatMoney } from './format';

interface ExportData {
  inventario: ReporteInventario;
  topMovidos: ProductoMovido[];
  stockBajo: Producto[];
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportReportesToExcel(data: ExportData): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const resumen = [
    ['Reporte de inventario'],
    [],
    ['Generado', new Date().toLocaleString('es-CO')],
    ['Total productos activos', data.inventario.totalProductos],
    ['Valor total inventario', data.inventario.valorTotal],
    ['Productos criticos (stock bajo o agotado)', data.stockBajo.length],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
  wsResumen['!cols'] = [{ wch: 36 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Hoja 2: Inventario por categoria
  const catHeaders = ['Categoría', 'Productos', 'Valor total'];
  const catRows = data.inventario.porCategoria.map((c) => [
    c.categoria,
    c.cantidadProductos,
    c.valorTotal,
  ]);
  const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  wsCat['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsCat, 'Por categoría');

  // Hoja 3: Top movidos
  const topHeaders = ['#', 'Código', 'Producto', 'Categoría', 'Movimientos', 'Total cantidad'];
  const topRows = data.topMovidos.map((t, i) => [
    i + 1,
    t.producto.codigo,
    t.producto.nombre,
    t.producto.categoria,
    t.totalMovimientos,
    t.totalCantidad,
  ]);
  const wsTop = XLSX.utils.aoa_to_sheet([topHeaders, ...topRows]);
  wsTop['!cols'] = [
    { wch: 4 },
    { wch: 14 },
    { wch: 36 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTop, 'Top movidos');

  // Hoja 4: Stock bajo
  const bajoHeaders = ['Código', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Estado'];
  const bajoRows = data.stockBajo.map((p) => [
    p.codigo,
    p.nombre,
    p.categoria,
    p.stock,
    p.stockMinimo,
    p.estadoStock,
  ]);
  const wsBajo = XLSX.utils.aoa_to_sheet([bajoHeaders, ...bajoRows]);
  wsBajo['!cols'] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBajo, 'Stock bajo');

  XLSX.writeFile(wb, `reportes_${timestamp()}.xlsx`);
}

export function exportReportesToPDF(data: ExportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de inventario', 40, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(
    `Generado: ${new Date().toLocaleString('es-CO')}`,
    pageWidth - 40,
    50,
    { align: 'right' },
  );

  // Resumen ejecutivo
  doc.setFontSize(10);
  doc.setTextColor(40);
  const resumen = [
    `Total productos activos: ${data.inventario.totalProductos}`,
    `Valor total inventario: ${formatMoney(data.inventario.valorTotal)}`,
    `Productos críticos: ${data.stockBajo.length}`,
  ];
  resumen.forEach((line, i) => {
    doc.text(line, 40, 80 + i * 14);
  });

  // Tabla 1: Inventario por categoria
  autoTable(doc, {
    startY: 130,
    head: [['Categoría', 'Productos', 'Valor total']],
    body: data.inventario.porCategoria.map((c) => [
      c.categoria,
      String(c.cantidadProductos),
      formatMoney(c.valorTotal),
    ]),
    foot: [
      [
        'Total',
        String(data.inventario.totalProductos),
        formatMoney(data.inventario.valorTotal),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    didDrawPage: () => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30);
      doc.text('Inventario por categoría', 40, 120);
    },
  });

  // Tabla 2: Top movidos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY1 = (doc as any).lastAutoTable?.finalY ?? 130;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Top productos más movidos (últimos 30 días)', 40, lastY1 + 30);

  autoTable(doc, {
    startY: lastY1 + 40,
    head: [['#', 'Código', 'Producto', 'Movs.', 'Cant.']],
    body: data.topMovidos.map((t, i) => [
      String(i + 1),
      t.producto.codigo,
      t.producto.nombre,
      String(t.totalMovimientos),
      String(t.totalCantidad),
    ]),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  });

  // Tabla 3: Stock bajo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY2 = (doc as any).lastAutoTable?.finalY ?? 200;
  if (data.stockBajo.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text('Productos con stock bajo o agotado', 40, lastY2 + 30);

    autoTable(doc, {
      startY: lastY2 + 40,
      head: [['Código', 'Producto', 'Stock', 'Mínimo', 'Estado']],
      body: data.stockBajo.map((p) => [
        p.codigo,
        p.nombre,
        String(p.stock),
        String(p.stockMinimo),
        p.estadoStock,
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [217, 119, 6], textColor: 255 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      didParseCell: (cell) => {
        if (cell.section !== 'body' || cell.column.index !== 4) return;
        const v = cell.cell.raw as string;
        if (v === 'AGOTADO') {
          cell.cell.styles.textColor = [220, 38, 38];
          cell.cell.styles.fontStyle = 'bold';
        } else if (v === 'BAJO') {
          cell.cell.styles.textColor = [217, 119, 6];
          cell.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  doc.save(`reportes_${timestamp()}.pdf`);
}
