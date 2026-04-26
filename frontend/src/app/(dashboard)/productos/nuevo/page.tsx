'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  CREAR_PRODUCTO,
  LISTAR_CATEGORIAS,
  LISTAR_PRODUCTOS,
} from '../../../../graphql/productos';
import {
  ProductoForm,
  type ProductoFormValues,
} from '../../../../components/productos/ProductoForm';
import { getErrorMessage } from '../../../../lib/errors';

export default function NuevoProductoPage() {
  const router = useRouter();
  const [crearProducto] = useMutation(CREAR_PRODUCTO, {
    refetchQueries: [LISTAR_PRODUCTOS, LISTAR_CATEGORIAS],
    onCompleted: () => {
      toast.success('Producto creado');
      router.push('/productos');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values: ProductoFormValues) => {
    try {
      await crearProducto({
        variables: {
          input: {
            codigo: values.codigo.trim(),
            nombre: values.nombre.trim(),
            descripcion: values.descripcion.trim() || undefined,
            categoria: values.categoria.trim(),
            stockMinimo: Number(values.stockMinimo),
            precioCompra: Number(values.precioCompra),
            precioVenta: Number(values.precioVenta),
          },
        },
      });
    } catch {
      // El toast ya se disparo via onError. Silenciamos para que el await
      // no burbujee a Formik (que setSubmitting(false) corra normal).
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/productos" className="hover:text-slate-900">
          Productos
        </Link>
        <span>/</span>
        <span className="text-slate-900">Nuevo</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo producto</h1>
        <p className="mt-1 text-sm text-slate-500">
          El stock inicial es cero. Se incrementa registrando movimientos de
          entrada.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProductoForm
          modo="crear"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/productos')}
        />
      </div>
    </div>
  );
}
