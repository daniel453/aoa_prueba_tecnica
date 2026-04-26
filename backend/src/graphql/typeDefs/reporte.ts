import gql from 'graphql-tag';

export const reporteTypeDefs = gql`
  type DashboardMetrics {
    totalProductos: Int!
    productosStockBajo: Int!
    productosAgotados: Int!
    valorInventario: Float!
    movimientosHoy: Int!
  }

  type MovimientoAgrupado {
    fecha: String!
    entradas: Int!
    salidas: Int!
  }

  type ProductoMovido {
    producto: Producto!
    totalMovimientos: Int!
    totalCantidad: Int!
  }

  type CategoriaResumen {
    categoria: String!
    cantidadProductos: Int!
    valorTotal: Float!
  }

  type ReporteInventario {
    totalProductos: Int!
    valorTotal: Float!
    porCategoria: [CategoriaResumen!]!
  }

  extend type Query {
    """
    Metricas para el dashboard principal.
    Si almacenId se proporciona, las metricas se calculan para ese almacen
    (excepto totalProductos que sigue siendo global).
    """
    dashboardMetrics(almacenId: ID): DashboardMetrics!

    """
    Ultimos movimientos registrados (orden cronologico desc), opcionalmente
    filtrados por almacen.
    """
    movimientosUltimos(limite: Int = 10, almacenId: ID): [Movimiento!]!

    """
    Movimientos agrupados por dia para los ultimos N dias.
    Si almacenId se proporciona, solo cuenta movimientos de ese almacen.
    """
    movimientosPorDia(dias: Int = 30, almacenId: ID): [MovimientoAgrupado!]!

    """
    Productos cuyo stock <= stockMinimo en el almacen indicado, o globalmente
    si almacenId no se proporciona.
    """
    productosStockBajo(almacenId: ID): [Producto!]!

    """
    Top N productos con mas movimientos en los ultimos N dias, opcionalmente
    scoped al almacen.
    """
    topProductosMovidos(
      limite: Int = 5
      dias: Int = 30
      almacenId: ID
    ): [ProductoMovido!]!

    """
    Reporte de inventario con totales y agrupacion por categoria.
    Si almacenId se proporciona, los valores se calculan para ese almacen.
    """
    reporteInventario(almacenId: ID): ReporteInventario!
  }
`;
