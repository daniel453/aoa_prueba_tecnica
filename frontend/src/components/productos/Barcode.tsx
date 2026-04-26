'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
  /** Si se pasa, agrega un boton "Imprimir" debajo del codigo que abre una
   *  ventana limpia con el codigo + label y dispara el dialogo de impresion. */
  printableLabel?: string;
}

export function Barcode({
  value,
  height = 50,
  fontSize = 12,
  displayValue = true,
  className = '',
  printableLabel,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        height,
        width: 1.6,
        fontSize,
        margin: 4,
        displayValue,
        background: '#ffffff',
        lineColor: '#0f172a',
      });
    } catch (err) {
      // valor no codificable como CODE128 (raro: cualquier string ASCII funciona)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Barcode error:', err);
      }
    }
  }, [value, height, fontSize, displayValue]);

  const handlePrint = () => {
    if (!svgRef.current) return;
    // Renderizamos un codigo mas grande para impresion (height x2.5)
    const printSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(printSvg, value, {
      format: 'CODE128',
      height: 90,
      width: 2.5,
      fontSize: 18,
      margin: 8,
      displayValue: true,
      background: '#ffffff',
      lineColor: '#0f172a',
    });
    const svgString = printSvg.outerHTML;

    const win = window.open('', '_blank', 'width=600,height=400');
    if (!win) return;
    const safeLabel = (printableLabel ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Codigo de barras - ${value}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        color: #0f172a;
      }
      .label {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        text-align: center;
        max-width: 80%;
      }
      svg { display: block; }
      @media print {
        @page { margin: 0.5cm; }
        body { padding: 0; min-height: auto; }
      }
    </style>
  </head>
  <body>
    ${safeLabel ? `<div class="label">${safeLabel}</div>` : ''}
    ${svgString}
    <script>
      window.addEventListener('load', function () {
        window.focus();
        window.print();
        window.addEventListener('afterprint', function () { window.close(); });
      });
    </script>
  </body>
</html>`);
    win.document.close();
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg ref={svgRef} className={className} />
      {printableLabel !== undefined && (
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
          Imprimir
        </button>
      )}
    </div>
  );
}
