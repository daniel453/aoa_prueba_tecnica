import { gql } from '@apollo/client';

export const AUTENTICAR_USUARIO = gql`
  mutation AutenticarUsuario($email: String!, $password: String!) {
    autenticarUsuario(email: $email, password: $password) {
      token
      usuario {
        _id
        nombre
        email
        rol
      }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      _id
      nombre
      email
      rol
    }
  }
`;
