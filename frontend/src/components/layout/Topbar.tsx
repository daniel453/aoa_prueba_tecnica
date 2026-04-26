'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/auth-context';
import { AlmacenSwitcher } from './AlmacenSwitcher';

interface TopbarProps {
  onOpenMenu: () => void;
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    router.replace('/login');
  };

  if (!usuario) return null;

  const initial = usuario.nombre.charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Abrir menú"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="hidden text-sm text-slate-500 sm:block">
          Hola,{' '}
          <span className="font-medium text-slate-900">{usuario.nombre}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <AlmacenSwitcher />
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-2 py-1 sm:px-3 sm:py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {initial}
          </div>
          <div className="hidden text-right sm:block">
            <p className="max-w-[160px] truncate text-xs font-medium leading-tight text-slate-900">
              {usuario.email}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {usuario.rol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:px-3"
          aria-label="Cerrar sesión"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
