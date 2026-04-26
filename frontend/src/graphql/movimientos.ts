import { gql } from '@apollo/client';

export const MOVIMIENTO_FIELDS = gql`
  fragment MovimientoFields on Movimiento {
    _id
    tipo
    cantidad
    precioUnitario
    stockAntes
    stockDespues
    observacion
    createdAt
    producto {
      _id
      codigo
      nombre
    }
    almacen {
      _id
      codigo
      nombre
    }
    usuario {
      _id
      nombre
      email
      rol
    }
  }
`;

export const LISTAR_MOVIMIENTOS = gql`
  query ListarMovimientos($filtro: FiltroMovimientos) {
    movimientos(filtro: $filtro) {
      items {
        ...MovimientoFields
      }
      total
      page
      pageSize
      totalPages
    }
  }
  ${MOVIMIENTO_FIELDS}
`;

export const KARDEX_PRODUCTO = gql`
  query KardexProducto(
    $productoId: ID!
    $desde: Date
    $hasta: Date
    $almacenId: ID
  ) {
    kardexProducto(
      productoId: $productoId
      desde: $desde
      hasta: $hasta
      almacenId: $almacenId
    ) {
      ...MovimientoFields
    }
  }
  ${MOVIMIENTO_FIELDS}
`;

export const REGISTRAR_ENTRADA = gql`
  mutation RegistrarEntrada($input: RegistrarMovimientoInput!) {
    registrarEntrada(input: $input) {
      ...MovimientoFields
    }
  }
  ${MOVIMIENTO_FIELDS}
`;

export const REGISTRAR_SALIDA = gql`
  mutation RegistrarSalida($input: RegistrarMovimientoInput!) {
    registrarSalida(input: $input) {
      ...MovimientoFields
    }
  }
  ${MOVIMIENTO_FIELDS}
`;
