'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  ELIMINAR_PRODUCTO,
  LISTAR_CATEGORIAS,
  LISTAR_PRODUCTOS,
  RESTAURAR_PRODUCTO,
} from '../../../graphql/productos';
import type {
  EstadoStock,
  Producto,
  ProductosPage,
} from '../../../types/producto';
import { useAuth } from '../../../lib/auth-context';
import { useDebounce } from '../../../lib/useDebounce';
import { formatMoney } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { StockBadge } from '../../../components/ui/StockBadge';
import { Modal } from '../../../components/ui/Modal';
import { useAlmacen } from '../../../lib/almacen-context';

const PAGE_SIZE = 10;

export default function ProductosPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { current, currentId } = useAlmacen();
  const isAdmin = usuario?.rol === 'ADMIN';

  const [busquedaInput, setBusquedaInput] = useState('');
  const [categoria, setCategoria] = useState<string>('');
  const [estadoStock, setEstadoStock] = useState<EstadoStock | ''>('');
  const [verEliminados, setVerEliminados] = useState(false);
  const [page, setPage] = useState(1);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(
    null,
  );

  const busqueda = useDebounce(busquedaInput, 350);

  const { data, loading, error, refetch } = useQuery<{
    productos: ProductosPage;
  }>(LISTAR_PRODUCTOS, {
    variables: {
      filtro: {
        busqueda: busqueda || undefined,
        categoria: categoria || undefined,
        estadoStock: estadoStock || undefined,
        activo: !verEliminados,
        almacenId: currentId || undefined,
        page,
        pageSize: PAGE_SIZE,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: categoriasData } = useQuery<{ categorias: string[] }>(
    LISTAR_CATEGORIAS,
  );

  const [eliminarProducto, { loading: eliminando }] = useMutation(
    ELIMINAR_PRODUCTO,
    {
      onCompleted: () => {
        toast.success('Producto eliminado');
        setProductoAEliminar(null);
        refetch();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    },
  );

  const [restaurarProducto] = useMutation(RESTAURAR_PRODUCTO, {
    onCompleted: () => {
      toast.success('Producto restaurado');
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleResetFiltros = () => {
    setBusquedaInput('');
    setCategoria('');
    setEstadoStock('');
    setPage(1);
  };

  const productos = data?.productos.items ?? [];
  const total = data?.productos.total ?? 0;
  const totalPages = data?.productos.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Productos
            {current && (
              <span className="ml-2 align-middle text-sm font-medium text-slate-500">
                · stock en {current.codigo}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {current
              ? `Mostrando el stock disponible en ${current.nombre}.`
              : 'Gestiona el catálogo de productos del inventario.'}
          </p>
        </div>
        <Link href="/productos/nuevo">
          <Button>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo producto
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              label="Buscar"
              type="search"
              placeholder="Código, nombre o descripción…"
              value={busquedaInput}
              onChange={(e) => {
                setBusquedaInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            label="Categoría"
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas</option>
            {categoriasData?.categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            label="Estado de stock"
            value={estadoStock}
            onChange={(e) => {
              setEstadoStock(e.target.value as EstadoStock | '');
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="OK">OK</option>
            <option value="BAJO">Stock bajo</option>
            <option value="AGOTADO">Agotado</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {isAdmin && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={verEliminados}
                onChange={(e) => {
                  setVerEliminados(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Mostrar productos eliminados
            </label>
          )}
          {(busquedaInput || categoria || estadoStock) && (
            <Button variant="ghost" size="sm" onClick={handleResetFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Código
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Categoría
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Stock
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Precio venta
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && productos.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-red-600"
                  >
                    {getErrorMessage(error, 'Error cargando productos')}
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr
                    key={p._id}
                    className={
                      p.activo
                        ? 'hover:bg-slate-50'
                        : 'bg-slate-50/60 text-slate-400 hover:bg-slate-100'
                    }
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <span className={p.activo ? 'text-slate-900' : 'line-through'}>
                        {p.nombre}
                      </span>
                      {!p.activo && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                          Eliminado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.categoria}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                      {currentId
                        ? (p.stockPorAlmacen.find(
                            (s) => s.almacen._id === currentId,
                          )?.stock ?? 0)
                        : p.stock}
                      <span className="ml-1 text-xs text-slate-400">
                        / min {p.stockMinimo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                      {formatMoney(p.precioVenta)}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge estado={p.estadoStock} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {p.activo ? (
                          <>
                            <button
                              type="button"
                              onClick={() => router.push(`/kardex/${p._id}`)}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                              title="Ver kardex"
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
                                <path d="M3 3v18h18M7 14l4-4 4 4 5-5" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/productos/${p._id}/editar`)
                              }
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                              title="Editar"
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
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setProductoAEliminar(p)}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600"
                                title="Eliminar"
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
                                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                                  <path d="M10 11v6M14 11v6" />
                                </svg>
                              </button>
                            )}
                          </>
                        ) : (
                          isAdmin && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                restaurarProducto({ variables: { id: p._id } })
                              }
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
                                <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4M3 4v4h4" />
                              </svg>
                              Restaurar
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-600">
              Mostrando{' '}
              <span className="font-medium text-slate-900">
                {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, total)}
              </span>{' '}
              de <span className="font-medium text-slate-900">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-slate-600">
                Página <span className="font-medium">{page}</span> /{' '}
                {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!productoAEliminar}
        onClose={() => setProductoAEliminar(null)}
        title="Eliminar producto"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setProductoAEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminando}
              onClick={() =>
                productoAEliminar &&
                eliminarProducto({ variables: { id: productoAEliminar._id } })
              }
            >
              Eliminar
            </Button>
          </>
        }
      >
        ¿Seguro que quieres eliminar el producto{' '}
        <strong className="font-semibold">{productoAEliminar?.nombre}</strong>{' '}
        (código <code className="font-mono">{productoAEliminar?.codigo}</code>)?
        <p className="mt-2 text-xs text-slate-500">
          Es un soft-delete: se conserva el historial de movimientos y puede
          restaurarse después.
        </p>
      </Modal>
    </div>
  );
}
