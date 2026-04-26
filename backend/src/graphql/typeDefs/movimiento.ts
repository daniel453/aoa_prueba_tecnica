import gql from 'graphql-tag';

export const movimientoTypeDefs = gql`
  enum TipoMovimiento {
    ENTRADA
    SALIDA
  }

  type Movimiento {
    _id: ID!
    producto: Producto!
    almacen: Almacen!
    tipo: TipoMovimiento!
    cantidad: Int!
    precioUnitario: Float!
    """Stock del almacen antes de este movimiento."""
    stockAntes: Int!
    """Stock del almacen despues de este movimiento."""
    stockDespues: Int!
    observacion: String!
    usuario: Usuario!
    createdAt: Date!
  }

  type MovimientosPage {
    items: [Movimiento!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  input RegistrarMovimientoInput {
    productoId: ID!
    almacenId: ID!
    cantidad: Int!
    precioUnitario: Float!
    observacion: String
  }

  input FiltroMovimientos {
    productoId: ID
    almacenId: ID
    tipo: TipoMovimiento
    desde: Date
    hasta: Date
    page: Int = 1
    pageSize: Int = 20
  }

  extend type Query {
    """
    Listado paginado de movimientos con filtros.
    """
    movimientos(filtro: FiltroMovimientos): MovimientosPage!
    movimiento(id: ID!): Movimiento
    """
    Kardex completo de un producto (todos sus movimientos en orden cronologico
    descendente, opcionalmente filtrado por rango de fechas y almacen).
    """
    kardexProducto(
      productoId: ID!
      desde: Date
      hasta: Date
      almacenId: ID
    ): [Movimiento!]!
  }

  extend type Mutation {
    """
    Registra una ENTRADA de inventario. Actualiza stock y recalcula el precio
    promedio ponderado del producto. Todo dentro de una transaccion Mongo.
    """
    registrarEntrada(input: RegistrarMovimientoInput!): Movimiento!
    """
    Registra una SALIDA de inventario. Falla con INSUFFICIENT_STOCK si
    cantidad > stock actual. No modifica el precio promedio.
    """
    registrarSalida(input: RegistrarMovimientoInput!): Movimiento!
  }
`;
