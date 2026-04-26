'use client';

import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { LISTAR_ALMACENES } from '../../graphql/almacenes';
import type { Almacen } from '../../types/almacen';
import { Select } from '../ui/Select';

interface AlmacenSelectorProps {
  value: string;
  onChange: (almacenId: string) => void;
  label?: string;
  error?: string;
  /** Si true, agrega opcion "Todos los almacenes" con value="" */
  allowAll?: boolean;
  disabled?: boolean;
}

export function AlmacenSelector({
  value,
  onChange,
  label = 'Almacén',
  error,
  allowAll = false,
  disabled = false,
}: AlmacenSelectorProps) {
  const { data } = useQuery<{ almacenes: Almacen[] }>(LISTAR_ALMACENES, {
    variables: { activo: true },
    fetchPolicy: 'cache-and-network',
  });

  const almacenes = data?.almacenes ?? [];

  // Auto-seleccionar el unico almacen disponible si no hay valor y no se permite "todos"
  useEffect(() => {
    if (!allowAll && !value && almacenes.length === 1) {
      onChange(almacenes[0]._id);
    }
  }, [allowAll, value, almacenes, onChange]);

  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled}
    >
      {allowAll && <option value="">Todos los almacenes</option>}
      {!allowAll && !value && <option value="">— elige un almacén —</option>}
      {almacenes.map((a) => (
        <option key={a._id} value={a._id}>
          {a.codigo} — {a.nombre}
        </option>
      ))}
    </Select>
  );
}
