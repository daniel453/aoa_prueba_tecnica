import gql from 'graphql-tag';

/**
 * Tipos base que cada modulo extiende con `extend type Query/Mutation`.
 * Tambien define los scalars personalizados.
 */
export const baseTypeDefs = gql`
  scalar Date

  type Query {
    _service: String!
  }

  type Mutation {
    _placeholder: String
  }
`;
