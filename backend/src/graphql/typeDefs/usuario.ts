import gql from 'graphql-tag';

export const usuarioTypeDefs = gql`
  enum Rol {
    ADMIN
    OPERADOR
  }

  type Usuario {
    _id: ID!
    nombre: String!
    email: String!
    rol: Rol!
    activo: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type AuthPayload {
    token: String!
    usuario: Usuario!
  }

  input CrearUsuarioInput {
    nombre: String!
    email: String!
    password: String!
    rol: Rol = OPERADOR
  }

  extend type Query {
    """
    Devuelve el usuario autenticado (payload del JWT).
    """
    me: Usuario
  }

  extend type Mutation {
    """
    Login: devuelve token JWT + datos del usuario.
    """
    autenticarUsuario(email: String!, password: String!): AuthPayload!

    """
    Crea un nuevo usuario. Solo accesible para administradores.
    """
    crearUsuario(input: CrearUsuarioInput!): Usuario!
  }
`;
