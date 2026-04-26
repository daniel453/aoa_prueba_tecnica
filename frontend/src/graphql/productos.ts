import { gql } from '@apollo/client';

export const PRODUCTO_FIELDS = gql`
  fragment ProductoFields on Producto {
    _id
    codigo
    nombre
    descripcion
    categoria
    stock
    stockMinimo
    stockPorAlmacen {
      stock
      stockMinimo
      almacen {
        _id
        codigo
        nombre
      }
    }
    precioCompra
    precioVenta
    precioPromedio
    estadoStock
    activo
    createdAt
    updatedAt
  }
`;

export const LISTAR_PRODUCTOS = gql`
  query ListarProductos($filtro: FiltroProductos) {
    productos(filtro: $filtro) {
      items {
        ...ProductoFields
      }
      total
      page
      pageSize
      totalPages
    }
  }
  ${PRODUCTO_FIELDS}
`;

export const OBTENER_PRODUCTO = gql`
  query ObtenerProducto($id: ID!) {
    producto(id: $id) {
      ...ProductoFields
    }
  }
  ${PRODUCTO_FIELDS}
`;

export const LISTAR_CATEGORIAS = gql`
  query ListarCategorias {
    categorias
  }
`;

export const CREAR_PRODUCTO = gql`
  mutation CrearProducto($input: CrearProductoInput!) {
    crearProducto(input: $input) {
      ...ProductoFields
    }
  }
  ${PRODUCTO_FIELDS}
`;

export const ACTUALIZAR_PRODUCTO = gql`
  mutation ActualizarProducto($id: ID!, $input: ActualizarProductoInput!) {
    actualizarProducto(id: $id, input: $input) {
      ...ProductoFields
    }
  }
  ${PRODUCTO_FIELDS}
`;

export const ELIMINAR_PRODUCTO = gql`
  mutation EliminarProducto($id: ID!) {
    eliminarProducto(id: $id) {
      _id
      activo
    }
  }
`;

export const RESTAURAR_PRODUCTO = gql`
  mutation RestaurarProducto($id: ID!) {
    restaurarProducto(id: $id) {
      ...ProductoFields
    }
  }
  ${PRODUCTO_FIELDS}
`;
