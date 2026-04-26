'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  REGISTRAR_ENTRADA,
  REGISTRAR_SALIDA,
  LISTAR_MOVIMIENTOS,
} from '../../graphql/movimientos';
import { LISTAR_PRODUCTOS } from '../../graphql/productos';
import type { Producto } from '../../types/producto';
import type { TipoMovimiento } from '../../types/movimiento';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MoneyInput } from '../ui/MoneyInput';
import { Modal } from '../ui/Modal';
import { ProductoSelector } from '../productos/ProductoSelector';
import { AlmacenSelector } from '../almacenes/AlmacenSelector';
import { formatMoney } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { useAlmacen } from '../../lib/almacen-context';

interface MovimientoFormProps {
  tipo: TipoMovimiento;
  productoInicial?: Producto | null;
}

interface MovimientoFormValues {
  cantidad: number | '';
  precioUnitario: number | '';
  observacion: string;
}

export function MovimientoForm({
  tipo,
  productoInicial = null,
}: MovimientoFormProps) {
  const router = useRouter();
  const { currentId: currentAlmacenId } = useAlmacen();
  const [producto, setProducto] = useState<Producto | null>(productoInicial);
  // Pre-selecciona el almacen del switcher global. Si el usuario
  // no tiene uno seleccionado ("Todos"), arranca vacio para forzar eleccion.
  const [almacenId, setAlmacenId] = useState<string>(currentAlmacenId);
  const [productoError, setProductoError] = useState<string | undefined>();
  const [almacenError, setAlmacenError] = useState<string | undefined>();
  const [confirmarOpen, setConfirmarOpen] = useState(false);

  const isEntrada = tipo === 'ENTRADA';

  // Stock del almacen seleccionado (no del producto global)
  const stockEnAlmacenSeleccionado = !producto || !almacenId
    ? 0
    : producto.stockPorAlmacen.find(
        (s) => s.almacen._id === almacenId,
      )?.stock ?? 0;

  const validationSchema = Yup.object({
    cantidad: Yup.number()
      .typeError('Debe ser un número')
      .integer('Debe ser entero')
      .min(1, 'Mínimo 1')
      .required('Requerido')
      .test(
        'stock-suficiente',
        'Cantidad mayor al stock disponible en este almacén',
        function (value) {
          if (isEntrada) return true;
          if (typeof value !== 'number') return true;
          if (!producto || !almacenId) return true;
          return value <= stockEnAlmacenSeleccionado;
        },
      ),
    precioUnitario: Yup.number()
      .typeError('Debe ser un número')
      .min(0.01, 'Debe ser mayor a 0')
      .required('Requerido'),
    observacion: Yup.string().max(500, 'Máximo 500 caracteres'),
  });

  const formik = useFormik<MovimientoFormValues>({
    initialValues: {
      cantidad: '',
      // ENTRADA: ultimo precio de compra como sugerencia (editable)
      // SALIDA:  precio de venta como sugerencia (editable)
      precioUnitario: isEntrada
        ? (productoInicial?.precioCompra ?? '')
        : (productoInicial?.precioVenta ?? ''),
      observacion: '',
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {
      let valid = true;
      if (!producto) {
        setProductoError('Selecciona un producto');
        valid = false;
      }
      if (!almacenId) {
        setAlmacenError('Selecciona un almacén');
        valid = false;
      }
      if (!valid) return;
      setConfirmarOpen(true);
    },
  });

  const mutation = isEntrada ? REGISTRAR_ENTRADA : REGISTRAR_SALIDA;
  const [registrar, { loading: registrando }] = useMutation(mutation, {
    refetchQueries: [LISTAR_MOVIMIENTOS, LISTAR_PRODUCTOS],
  });

  const handleConfirmar = async () => {
    if (!producto || !almacenId) return;
    try {
      await registrar({
        variables: {
          input: {
            productoId: producto._id,
            almacenId,
            cantidad: Number(formik.values.cantidad),
            precioUnitario: Number(formik.values.precioUnitario),
            observacion: formik.values.observacion.trim() || undefined,
          },
        },
      });
      toast.success(
        isEntrada ? 'Entrada registrada' : 'Salida registrada',
      );
      setConfirmarOpen(false);
      router.push('/movimientos');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmarOpen(false);
    }
  };

  const cantidadNum =
    typeof formik.values.cantidad === 'number' ? formik.values.cantidad : 0;
  const precioNum =
    typeof formik.values.precioUnitario === 'number'
      ? formik.values.precioUnitario
      : 0;
  // stockAntes/Despues son del ALMACEN seleccionado
  const stockAntesAlmacen = stockEnAlmacenSeleccionado;
  const stockDespues = producto
    ? isEntrada
      ? stockAntesAlmacen + cantidadNum
      : stockAntesAlmacen - cantidadNum
    : 0;
  const total = cantidadNum * precioNum;

  return (
    <>
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
        <ProductoSelector
          value={producto}
          onChange={(p) => {
            setProducto(p);
            setProductoError(undefined);
            formik.validateField('cantidad');
            if (p) {
              formik.setFieldValue(
                'precioUnitario',
                isEntrada ? p.precioCompra : p.precioVenta,
                true,
              );
            }
          }}
          disableAgotados={!isEntrada}
          error={productoError}
        />

        <AlmacenSelector
          value={almacenId}
          onChange={(id) => {
            setAlmacenId(id);
            setAlmacenError(undefined);
            formik.validateField('cantidad');
          }}
          error={almacenError}
        />

        {producto && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {almacenId ? 'Stock en almacén' : 'Stock total'}
              </p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {almacenId ? stockEnAlmacenSeleccionado : producto.stock}
                {almacenId && (
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (total: {producto.stock})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Stock mínimo
              </p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {producto.stockMinimo}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Precio compra
              </p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {formatMoney(producto.precioCompra)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Precio venta
              </p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {formatMoney(producto.precioVenta)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Cantidad"
            name="cantidad"
            type="number"
            min={1}
            step={1}
            placeholder="0"
            value={formik.values.cantidad}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.cantidad ? formik.errors.cantidad : undefined
            }
          />
          <MoneyInput
            label={
              isEntrada ? 'Precio unitario (compra)' : 'Precio venta sugerido'
            }
            name="precioUnitario"
            min={0}
            value={formik.values.precioUnitario}
            onValueChange={(v) =>
              formik.setFieldValue('precioUnitario', v, true)
            }
            onBlur={formik.handleBlur}
            error={
              formik.touched.precioUnitario
                ? formik.errors.precioUnitario
                : undefined
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="observacion"
            className="text-sm font-medium text-slate-700"
          >
            Observación{' '}
            <span className="text-xs font-normal text-slate-400">
              (opcional)
            </span>
          </label>
          <textarea
            id="observacion"
            name="observacion"
            rows={3}
            value={formik.values.observacion}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Motivo del movimiento, número de factura, etc."
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.observacion && formik.errors.observacion && (
            <p className="text-xs text-red-600">{formik.errors.observacion}</p>
          )}
        </div>

        {producto && cantidadNum > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-blue-700">
              Resumen
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700 sm:grid-cols-4">
              <div>
                Stock antes:{' '}
                <span className="font-semibold">{stockAntesAlmacen}</span>
              </div>
              <div>
                {isEntrada ? '+' : '−'} cantidad:{' '}
                <span className="font-semibold">{cantidadNum}</span>
              </div>
              <div>
                Stock después:{' '}
                <span
                  className={`font-semibold ${
                    stockDespues < 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {stockDespues}
                </span>
              </div>
              <div>
                Total:{' '}
                <span className="font-semibold">{formatMoney(total)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/movimientos')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={isEntrada ? 'primary' : 'danger'}
            disabled={!producto || !formik.isValid || !formik.dirty}
          >
            {isEntrada ? 'Registrar entrada' : 'Registrar salida'}
          </Button>
        </div>
      </form>

      <Modal
        open={confirmarOpen}
        onClose={() => setConfirmarOpen(false)}
        title={isEntrada ? 'Confirmar entrada' : 'Confirmar salida'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmarOpen(false)}
              disabled={registrando}
            >
              Volver
            </Button>
            <Button
              variant={isEntrada ? 'primary' : 'danger'}
              loading={registrando}
              onClick={handleConfirmar}
            >
              Confirmar
            </Button>
          </>
        }
      >
        {producto && (
          <div className="space-y-3">
            <p>
              Vas a registrar una{' '}
              <strong>{isEntrada ? 'entrada' : 'salida'}</strong> sobre:
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{producto.nombre}</p>
              <p className="text-xs text-slate-500">
                Código <code className="font-mono">{producto.codigo}</code>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Cantidad</dt>
                <dd className="font-semibold">{cantidadNum}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Precio unitario</dt>
                <dd className="font-semibold">{formatMoney(precioNum)}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Stock antes (almacén)</dt>
                <dd className="font-semibold">{stockAntesAlmacen}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Stock después</dt>
                <dd
                  className={`font-semibold ${
                    stockDespues < 0 ? 'text-red-600' : ''
                  }`}
                >
                  {stockDespues}
                </dd>
              </div>
              <div className="col-span-2 mt-1 flex justify-between text-base">
                <dt className="font-semibold text-slate-700">Total</dt>
                <dd className="font-bold text-slate-900">
                  {formatMoney(total)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
