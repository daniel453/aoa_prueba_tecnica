'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  ACTUALIZAR_ALMACEN,
  CREAR_ALMACEN,
  ELIMINAR_ALMACEN,
  LISTAR_ALMACENES,
  RESTAURAR_ALMACEN,
} from '../../../graphql/almacenes';
import type { Almacen } from '../../../types/almacen';
import { useAuth } from '../../../lib/auth-context';
import { getErrorMessage } from '../../../lib/errors';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { formatDate } from '../../../lib/format';

interface FormValues {
  codigo: string;
  nombre: string;
  direccion: string;
}

const crearSchema = Yup.object({
  codigo: Yup.string().min(2).max(30).required('Requerido'),
  nombre: Yup.string().min(2).max(100).required('Requerido'),
  direccion: Yup.string().max(200),
});

const editarSchema = Yup.object({
  codigo: Yup.string(),
  nombre: Yup.string().min(2).max(100).required('Requerido'),
  direccion: Yup.string().max(200),
});

export default function AlmacenesPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'ADMIN';

  const [verInactivos, setVerInactivos] = useState(false);
  const [editando, setEditando] = useState<Almacen | null>(null);
  const [creando, setCreando] = useState(false);
  const [eliminandoAlm, setEliminandoAlm] = useState<Almacen | null>(null);

  const { data, loading, refetch } = useQuery<{ almacenes: Almacen[] }>(
    LISTAR_ALMACENES,
    {
      variables: { activo: verInactivos ? false : true },
      fetchPolicy: 'cache-and-network',
    },
  );

  const [crearAlmacen] = useMutation(CREAR_ALMACEN, {
    onCompleted: () => {
      toast.success('Almacén creado');
      setCreando(false);
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const [actualizarAlmacen] = useMutation(ACTUALIZAR_ALMACEN, {
    onCompleted: () => {
      toast.success('Almacén actualizado');
      setEditando(null);
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const [eliminarAlmacen, { loading: eliminando }] = useMutation(
    ELIMINAR_ALMACEN,
    {
      onCompleted: () => {
        toast.success('Almacén eliminado');
        setEliminandoAlm(null);
        refetch();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    },
  );

  const [restaurarAlmacen] = useMutation(RESTAURAR_ALMACEN, {
    onCompleted: () => {
      toast.success('Almacén restaurado');
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      codigo: editando?.codigo ?? '',
      nombre: editando?.nombre ?? '',
      direccion: editando?.direccion ?? '',
    },
    enableReinitialize: true,
    validationSchema: editando ? editarSchema : crearSchema,
    onSubmit: async (values) => {
      if (editando) {
        await actualizarAlmacen({
          variables: {
            id: editando._id,
            input: {
              nombre: values.nombre.trim(),
              direccion: values.direccion.trim(),
            },
          },
        });
      } else {
        await crearAlmacen({
          variables: {
            input: {
              codigo: values.codigo.trim(),
              nombre: values.nombre.trim(),
              direccion: values.direccion.trim() || undefined,
            },
          },
        });
      }
    },
  });

  const almacenes = data?.almacenes ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Almacenes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Bodegas, sucursales o ubicaciones donde se distribuye el
            inventario.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditando(null);
              setCreando(true);
              formik.resetForm();
            }}
          >
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
            Nuevo almacén
          </Button>
        )}
      </div>

      {isAdmin && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={verInactivos}
            onChange={(e) => setVerInactivos(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Mostrar inactivos
        </label>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                Dirección
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Creado
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && almacenes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : almacenes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Sin almacenes registrados.
                </td>
              </tr>
            ) : (
              almacenes.map((a) => (
                <tr key={a._id} className={a.activo ? '' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {a.codigo}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {a.nombre}
                    {!a.activo && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.direccion || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {isAdmin && a.activo && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCreando(false);
                              setEditando(a);
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                            title="Editar"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEliminandoAlm(a)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600"
                            title="Eliminar"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </>
                      )}
                      {isAdmin && !a.activo && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => restaurarAlmacen({ variables: { id: a._id } })}
                        >
                          Restaurar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={creando || !!editando}
        onClose={() => {
          setCreando(false);
          setEditando(null);
        }}
        title={editando ? 'Editar almacén' : 'Nuevo almacén'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreando(false);
                setEditando(null);
              }}
              disabled={formik.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              loading={formik.isSubmitting}
              onClick={() => formik.handleSubmit()}
            >
              {editando ? 'Guardar cambios' : 'Crear'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Código"
            name="codigo"
            placeholder="PRINCIPAL"
            value={formik.values.codigo}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.codigo
                ? (formik.errors.codigo as string | undefined)
                : undefined
            }
            disabled={!!editando}
          />
          <Input
            label="Nombre"
            name="nombre"
            placeholder="Almacén Principal"
            value={formik.values.nombre}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.nombre
                ? (formik.errors.nombre as string | undefined)
                : undefined
            }
          />
          <Input
            label="Dirección"
            name="direccion"
            placeholder="Calle 100 #15-20"
            value={formik.values.direccion}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.direccion
                ? (formik.errors.direccion as string | undefined)
                : undefined
            }
          />
        </div>
      </Modal>

      <Modal
        open={!!eliminandoAlm}
        onClose={() => setEliminandoAlm(null)}
        title="Eliminar almacén"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEliminandoAlm(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminando}
              onClick={() =>
                eliminandoAlm &&
                eliminarAlmacen({ variables: { id: eliminandoAlm._id } })
              }
            >
              Eliminar
            </Button>
          </>
        }
      >
        ¿Seguro que quieres eliminar el almacén{' '}
        <strong>{eliminandoAlm?.nombre}</strong> (código{' '}
        <code className="font-mono">{eliminandoAlm?.codigo}</code>)?
        <p className="mt-2 text-xs text-slate-500">
          Soft-delete: los movimientos históricos siguen existiendo. Puedes
          restaurarlo después.
        </p>
      </Modal>
    </div>
  );
}
