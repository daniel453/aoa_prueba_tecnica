'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@apollo/client';
import { LISTAR_CATEGORIAS } from '../../graphql/productos';
import type { Producto } from '../../types/producto';
import { Input } from '../ui/Input';
import { MoneyInput } from '../ui/MoneyInput';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface ProductoFormValues {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  stockMinimo: number | '';
  precioCompra: number | '';
  precioVenta: number | '';
}

interface ProductoFormProps {
  modo: 'crear' | 'editar';
  inicial?: Producto;
  onSubmit: (values: ProductoFormValues) => Promise<void>;
  onCancel: () => void;
}

const baseSchema = {
  nombre: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
  descripcion: Yup.string(),
  categoria: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
  stockMinimo: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser entero')
    .min(0, 'No puede ser negativo')
    .required('Requerido'),
  precioCompra: Yup.number()
    .typeError('Debe ser un número')
    .min(0, 'No puede ser negativo')
    .required('Requerido'),
  precioVenta: Yup.number()
    .typeError('Debe ser un número')
    .min(0, 'No puede ser negativo')
    .required('Requerido'),
};

const crearSchema = Yup.object({
  ...baseSchema,
  codigo: Yup.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50')
    .required('Requerido'),
});

const editarSchema = Yup.object({
  ...baseSchema,
  codigo: Yup.string(),
});

export function ProductoForm({
  modo,
  inicial,
  onSubmit,
  onCancel,
}: ProductoFormProps) {
  const { data: categoriasData } = useQuery<{ categorias: string[] }>(
    LISTAR_CATEGORIAS,
  );

  const formik = useFormik<ProductoFormValues>({
    initialValues: {
      codigo: inicial?.codigo ?? '',
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      categoria: inicial?.categoria ?? '',
      stockMinimo: inicial?.stockMinimo ?? '',
      precioCompra: inicial?.precioCompra ?? '',
      precioVenta: inicial?.precioVenta ?? '',
    },
    validationSchema: modo === 'crear' ? crearSchema : editarSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const err = (k: keyof ProductoFormValues) =>
    formik.touched[k] ? (formik.errors[k] as string | undefined) : undefined;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Código"
          name="codigo"
          placeholder="ELEC-001"
          value={formik.values.codigo}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={err('codigo')}
          disabled={modo === 'editar'}
        />
        <Input
          label="Nombre"
          name="nombre"
          placeholder="Mouse inalámbrico"
          value={formik.values.nombre}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={err('nombre')}
        />
      </div>

      <Input
        label="Descripción"
        name="descripcion"
        placeholder="Descripción opcional…"
        value={formik.values.descripcion}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={err('descripcion')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Categoría</label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Select
            name="categoriaSel"
            value={
              categoriasData?.categorias.includes(formik.values.categoria)
                ? formik.values.categoria
                : ''
            }
            onChange={(e) =>
              formik.setFieldValue('categoria', e.target.value, true)
            }
          >
            <option value="">— elegir existente —</option>
            {categoriasData?.categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            name="categoria"
            placeholder="o escribe una nueva"
            value={formik.values.categoria}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={err('categoria')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label="Stock mínimo"
          name="stockMinimo"
          type="number"
          min={0}
          step={1}
          value={formik.values.stockMinimo}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={err('stockMinimo')}
        />
        <MoneyInput
          label="Precio compra"
          name="precioCompra"
          min={0}
          value={formik.values.precioCompra}
          onValueChange={(v) => formik.setFieldValue('precioCompra', v, true)}
          onBlur={formik.handleBlur}
          error={err('precioCompra')}
        />
        <MoneyInput
          label="Precio venta"
          name="precioVenta"
          min={0}
          value={formik.values.precioVenta}
          onValueChange={(v) => formik.setFieldValue('precioVenta', v, true)}
          onBlur={formik.handleBlur}
          error={err('precioVenta')}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={formik.isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={formik.isSubmitting}>
          {modo === 'crear' ? 'Crear producto' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
