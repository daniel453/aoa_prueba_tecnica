import gql from 'graphql-tag';

export const almacenTypeDefs = gql`
  type Almacen {
    _id: ID!
    codigo: String!
    nombre: String!
    direccion: String!
    activo: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type StockEnAlmacen {
    almacen: Almacen!
    stock: Int!
    stockMinimo: Int!
  }

  input CrearAlmacenInput {
    codigo: String!
    nombre: String!
    direccion: String
  }

  input ActualizarAlmacenInput {
    nombre: String
    direccion: String
  }

  extend type Query {
    almacenes(activo: Boolean): [Almacen!]!
    almacen(id: ID!): Almacen
  }

  extend type Mutation {
    crearAlmacen(input: CrearAlmacenInput!): Almacen!
    actualizarAlmacen(id: ID!, input: ActualizarAlmacenInput!): Almacen!
    """
    Soft-delete: marca el almacen como inactivo. Solo ADMIN.
    Mantiene al menos un almacen activo en el sistema.
    """
    eliminarAlmacen(id: ID!): Almacen!
    restaurarAlmacen(id: ID!): Almacen!
  }
`;
