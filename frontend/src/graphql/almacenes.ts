import { gql } from '@apollo/client';

export const ALMACEN_FIELDS = gql`
  fragment AlmacenFields on Almacen {
    _id
    codigo
    nombre
    direccion
    activo
    createdAt
    updatedAt
  }
`;

export const LISTAR_ALMACENES = gql`
  query ListarAlmacenes($activo: Boolean) {
    almacenes(activo: $activo) {
      ...AlmacenFields
    }
  }
  ${ALMACEN_FIELDS}
`;

export const OBTENER_ALMACEN = gql`
  query ObtenerAlmacen($id: ID!) {
    almacen(id: $id) {
      ...AlmacenFields
    }
  }
  ${ALMACEN_FIELDS}
`;

export const CREAR_ALMACEN = gql`
  mutation CrearAlmacen($input: CrearAlmacenInput!) {
    crearAlmacen(input: $input) {
      ...AlmacenFields
    }
  }
  ${ALMACEN_FIELDS}
`;

export const ACTUALIZAR_ALMACEN = gql`
  mutation ActualizarAlmacen($id: ID!, $input: ActualizarAlmacenInput!) {
    actualizarAlmacen(id: $id, input: $input) {
      ...AlmacenFields
    }
  }
  ${ALMACEN_FIELDS}
`;

export const ELIMINAR_ALMACEN = gql`
  mutation EliminarAlmacen($id: ID!) {
    eliminarAlmacen(id: $id) {
      _id
      activo
    }
  }
`;

export const RESTAURAR_ALMACEN = gql`
  mutation RestaurarAlmacen($id: ID!) {
    restaurarAlmacen(id: $id) {
      ...AlmacenFields
    }
  }
  ${ALMACEN_FIELDS}
`;
