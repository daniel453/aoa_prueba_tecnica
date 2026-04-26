'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  ACTUALIZAR_PRODUCTO,
  LISTAR_CATEGORIAS,
  LISTAR_PRODUCTOS,
  OBTENER_PRODUCTO,
} from '../../../../../graphql/productos';
import type { Producto } from '../../../../../types/producto';
import {
  ProductoForm,
  type ProductoFormValues,
} from '../../../../../components/productos/ProductoForm';
import { getErrorMessage } from '../../../../../lib/errors';

interface EditarProductoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: EditarProductoPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data, loading, error } = useQuery<{ producto: Producto | null }>(
    OBTENER_PRODUCTO,
    { variables: { id }, fetchPolicy: 'cache-and-network' },
  );

  const [actualizarProducto] = useMutation(ACTUALIZAR_PRODUCTO, {
    refetchQueries: [LISTAR_PRODUCTOS, LISTAR_CATEGORIAS],
    onCompleted: () => {
      toast.success('Producto actualizado');
      router.push('/productos');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values: ProductoFormValues) => {
    try {
      await actualizarProducto({
        variables: {
          id,
          input: {
            nombre: values.nombre.trim(),
            descripcion: values.descripcion.trim(),
            categoria: values.categoria.trim(),
            stockMinimo: Number(values.stockMinimo),
            precioCompra: Number(values.precioCompra),
            precioVenta: Number(values.precioVenta),
          },
        },
      });
    } catch {
      // Toast ya disparado via onError. Silenciamos para no propagar a Formik.
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <svg
            className="h-5 w-5 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Cargando…
        </div>
      </div>
    );
  }

  if (error || !data?.producto) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error
          ? getErrorMessage(error, 'Error cargando producto')
          : 'Producto no encontrado'}
      </div>
    );
  }

  const producto = data.producto;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/productos" className="hover:text-slate-900">
          Productos
        </Link>
        <span>/</span>
        <span className="text-slate-900">Editar</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Editar {producto.nombre}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Código <code className="font-mono">{producto.codigo}</code> · Stock
          actual: <strong className="text-slate-900">{producto.stock}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProductoForm
          modo="editar"
          inicial={producto}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/productos')}
        />
      </div>
    </div>
  );
}
