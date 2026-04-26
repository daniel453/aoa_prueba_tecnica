'use client';

import { useEffect, useRef, useState } from 'react';
import { useAlmacen } from '../../lib/almacen-context';

export function AlmacenSwitcher() {
  const { almacenes, current, setCurrent } = useAlmacen();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (almacenes.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 sm:px-3"
      >
        <svg
          className="h-4 w-4 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path d="M9 22V12h6v10" />
        </svg>
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            Almacén
          </span>
          <span className="font-medium text-slate-900">
            {current ? current.codigo : 'Todos'}
          </span>
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cambiar almacén
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Filtra movimientos y formularios
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrent(null);
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50 ${!current ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700'}`}
          >
            <span>Todos los almacenes</span>
            {!current && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="max-h-64 overflow-y-auto">
            {almacenes.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => {
                  setCurrent(a._id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50 ${current?._id === a._id ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700'}`}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{a.nombre}</span>
                  <span className="text-xs text-slate-500">
                    <code className="font-mono">{a.codigo}</code>
                    {a.direccion && ` · ${a.direccion}`}
                  </span>
                </span>
                {current?._id === a._id && (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
