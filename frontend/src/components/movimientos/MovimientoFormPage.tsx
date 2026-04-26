'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { OBTENER_PRODUCTO } from '../../graphql/productos';
import type { Producto } from '../../types/producto';
import type { TipoMovimiento } from '../../types/movimiento';
import { MovimientoForm } from './MovimientoForm';

/**
 * Wrapper que lee ?productoId= del query string y precarga el producto
 * para pasarlo como `productoInicial` a MovimientoForm.
 *
 * Si no hay productoId, el form arranca con el selector vacio.
 *
 * useSearchParams requiere Suspense durante prerender (Next 16),
 * por eso el componente externo lo envuelve.
 */
function MovimientoFormWithPreload({ tipo }: { tipo: TipoMovimiento }) {
  const searchParams = useSearchParams();
  const productoId = searchParams.get('productoId');

  const { data, loading } = useQuery<{ producto: Producto | null }>(
    OBTENER_PRODUCTO,
    {
      variables: { id: productoId },
      skip: !productoId,
      fetchPolicy: 'cache-and-network',
    },
  );

  // Mientras se carga el producto preseleccionado, mostramos placeholder.
  // (Si no hay productoId no hay nada que cargar.)
  if (productoId && loading && !data) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
        Cargando producto…
      </div>
    );
  }

  return <MovimientoForm tipo={tipo} productoInicial={data?.producto ?? null} />;
}

export function MovimientoFormPage({ tipo }: { tipo: TipoMovimiento }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          Cargando…
        </div>
      }
    >
      <MovimientoFormWithPreload tipo={tipo} />
    </Suspense>
  );
}
