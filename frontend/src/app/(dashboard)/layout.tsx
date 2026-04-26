'use client';

import { useState, type ReactNode } from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { AlmacenProvider } from '../../lib/almacen-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <AlmacenProvider>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />
          <div className="flex flex-1 flex-col">
            <Topbar onOpenMenu={() => setMobileMenuOpen(true)} />
            <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </AlmacenProvider>
    </AuthGuard>
  );
}
