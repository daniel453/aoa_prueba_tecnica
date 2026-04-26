import gql from 'graphql-tag';

export const productoTypeDefs = gql`
  enum EstadoStock {
    OK
    BAJO
    AGOTADO
  }

  type Producto {
    _id: ID!
    codigo: String!
    nombre: String!
    descripcion: String!
    categoria: String!
    """Stock total agregado (suma de todos los almacenes)."""
    stock: Int!
    """Stock minimo global (umbral para estado BAJO)."""
    stockMinimo: Int!
    """Desglose de stock por almacen."""
    stockPorAlmacen: [StockEnAlmacen!]!
    precioCompra: Float!
    precioVenta: Float!
    precioPromedio: Float!
    estadoStock: EstadoStock!
    activo: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type ProductosPage {
    items: [Producto!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  input CrearProductoInput {
    codigo: String!
    nombre: String!
    descripcion: String
    categoria: String!
    stockMinimo: Int!
    precioCompra: Float!
    precioVenta: Float!
  }

  input ActualizarProductoInput {
    nombre: String
    descripcion: String
    categoria: String
    stockMinimo: Int
    precioCompra: Float
    precioVenta: Float
  }

  input FiltroProductos {
    busqueda: String
    categoria: String
    estadoStock: EstadoStock
    activo: Boolean = true
    """
    Si se proporciona, los filtros estadoStock y los stocks reportados
    se calculan contra ese almacen (no el global).
    """
    almacenId: ID
    page: Int = 1
    pageSize: Int = 10
  }

  extend type Query {
    """
    Listado paginado de productos con filtros opcionales.
    """
    productos(filtro: FiltroProductos): ProductosPage!
    producto(id: ID!): Producto
    productoPorCodigo(codigo: String!): Producto
    """
    Lista de categorias en uso (productos activos).
    """
    categorias: [String!]!
  }

  extend type Mutation {
    crearProducto(input: CrearProductoInput!): Producto!
    actualizarProducto(id: ID!, input: ActualizarProductoInput!): Producto!
    """
    Soft-delete: marca el producto como inactivo. Solo ADMIN.
    """
    eliminarProducto(id: ID!): Producto!
    """
    Restaura un producto eliminado. Solo ADMIN.
    """
    restaurarProducto(id: ID!): Producto!
  }
`;
