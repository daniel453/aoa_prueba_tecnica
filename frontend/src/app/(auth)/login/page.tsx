'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getErrorCode, getErrorMessage } from '../../../lib/errors';

const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email inválido')
    .required('El email es obligatorio'),
  password: Yup.string()
    .min(6, 'Mínimo 6 caracteres')
    .required('La contraseña es obligatoria'),
});

function ExpiredToast() {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('reason') === 'expired') {
      toast.error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
  }, [searchParams]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { usuario, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && usuario) {
      router.replace('/dashboard');
    }
  }, [loading, usuario, router]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await login(values.email, values.password);
        toast.success('¡Bienvenido!');
        router.replace('/dashboard');
      } catch (err) {
        const code = getErrorCode(err);
        const msg =
          code === 'INVALID_CREDENTIALS'
            ? 'Credenciales inválidas'
            : code === 'VALIDATION_ERROR'
              ? 'Datos inválidos'
              : getErrorMessage(err, 'Error al iniciar sesión');
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <Suspense fallback={null}>
        <ExpiredToast />
      </Suspense>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Inventario & Kardex
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inicia sesión con tu cuenta
          </p>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@inventario.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email ? formik.errors.email : undefined}
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password ? formik.errors.password : undefined}
          />

          <Button type="submit" loading={formik.isSubmitting} size="lg">
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Credenciales de prueba:</p>
          <p className="mt-1">
            Admin: <code className="font-mono">admin@inventario.com</code> /{' '}
            <code className="font-mono">Admin123!</code>
          </p>
          <p>
            Operador: <code className="font-mono">operador@inventario.com</code>{' '}
            / <code className="font-mono">Operador123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
