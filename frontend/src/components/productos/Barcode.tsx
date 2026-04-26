'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
}

export function Barcode({
  value,
  height = 50,
  fontSize = 12,
  displayValue = true,
  className = '',
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

  return <svg ref={svgRef} className={className} />;
}
