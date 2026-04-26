'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from 'react';

interface MoneyInputProps {
  name: string;
  label?: string;
  value: number | '';
  /** Recibe el numero crudo (number) o '' si esta vacio. Se conecta con
   *  Formik via formik.setFieldValue(name, v). */
  onValueChange: (value: number | '') => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
}

// "1500"     -> "1,500"
// "1500.50"  -> "1,500.50"
// "1500."    -> "1,500."  (preserva el punto colgante mientras el usuario tipea)
function formatNumberStr(cleaned: string): string {
  if (cleaned === '') return '';
  const dotIdx = cleaned.indexOf('.');
  const intPart = dotIdx === -1 ? cleaned : cleaned.slice(0, dotIdx);
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (dotIdx === -1) return formattedInt;
  return `${formattedInt}.${cleaned.slice(dotIdx + 1)}`;
}

function externalToDisplay(value: number | ''): string {
  if (value === '') return '';
  return formatNumberStr(String(value));
}

export function MoneyInput({
  name,
  label,
  value,
  onValueChange,
  onBlur,
  error,
  placeholder,
  disabled,
  min,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState<string>(() => externalToDisplay(value));
  const [pendingCursor, setPendingCursor] = useState<number | null>(null);
  const isInternalChange = useRef(false);

  // Sincroniza si el valor cambia desde fuera (reset del form, setFieldValue externo).
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    setDisplay(externalToDisplay(value));
  }, [value]);

  // Aplica la posicion del cursor despues del re-render para que no salte.
  useLayoutEffect(() => {
    if (pendingCursor !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor, pendingCursor);
      setPendingCursor(null);
    }
  }, [pendingCursor, display]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cursorBefore = e.target.selectionStart ?? raw.length;

    // Cuenta caracteres significativos (digitos + punto) a la izquierda del cursor en el raw
    const sigBefore = raw.slice(0, cursorBefore).replace(/[^\d.]/g, '').length;

    // Quita las comas (separadores) y deja solo digitos + punto
    const cleaned = raw.replace(/,/g, '');

    // Valida: solo digitos, opcionalmente un punto decimal, max 2 decimales.
    // Rechaza la tecla manteniendo el display actual (input controlado).
    if (cleaned !== '' && !/^\d*\.?\d{0,2}$/.test(cleaned)) {
      // Forzamos rerender al valor anterior dejando el cursor donde estaba antes.
      setPendingCursor(Math.max(0, cursorBefore - 1));
      return;
    }

    // Vacio o solo "."
    if (cleaned === '' || cleaned === '.') {
      isInternalChange.current = true;
      onValueChange('');
      setDisplay(cleaned);
      setPendingCursor(cursorBefore);
      return;
    }

    // Numero parseable (Number maneja "1500." como 1500)
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return;

    const formatted = formatNumberStr(cleaned);

    // Posiciona el cursor despues del N-esimo caracter significativo en formatted
    let newCursor = formatted.length;
    if (sigBefore === 0) {
      newCursor = 0;
    } else {
      let count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/[\d.]/.test(formatted[i])) {
          count++;
          if (count === sigBefore) {
            newCursor = i + 1;
            break;
          }
        }
      }
    }

    isInternalChange.current = true;
    setDisplay(formatted);
    onValueChange(n);
    setPendingCursor(newCursor);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // Limpia un punto decimal colgante ("1,500." -> "1,500") al salir del campo
    const cleaned = display.replace(/,/g, '');
    if (cleaned.endsWith('.')) {
      setDisplay(formatNumberStr(cleaned.slice(0, -1)));
    }
    // Si el min se viola, ajustamos al min
    if (typeof value === 'number' && min !== undefined && value < min) {
      onValueChange(min);
    }
    onBlur?.(e);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          $
        </span>
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder ?? '0'}
          disabled={disabled}
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`h-10 w-full rounded-md border bg-white pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-500 ${
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
