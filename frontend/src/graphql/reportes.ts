import { gql } from '@apollo/client';
import { MOVIMIENTO_FIELDS } from './movimientos';
import { PRODUCTO_FIELDS } from './productos';

export const DASHBOARD_METRICS = gql`
  query DashboardMetrics($almacenId: ID) {
    dashboardMetrics(almacenId: $almacenId) {
      totalProductos
      productosStockBajo
      productosAgotados
      valorInventario
      movimientosHoy
    }
  }
`;

export const MOVIMIENTOS_ULTIMOS = gql`
  query MovimientosUltimos($limite: Int, $almacenId: ID) {
    movimientosUltimos(limite: $limite, almacenId: $almacenId) {
      ...MovimientoFields
    }
  }
  ${MOVIMIENTO_FIELDS}
`;

export const MOVIMIENTOS_POR_DIA = gql`
  query MovimientosPorDia($dias: Int, $almacenId: ID) {
    movimientosPorDia(dias: $dias, almacenId: $almacenId) {
      fecha
      entradas
      salidas
    }
  }
`;

export const PRODUCTOS_STOCK_BAJO = gql`
  query ProductosStockBajo($almacenId: ID) {
    productosStockBajo(almacenId: $almacenId) {
      ...ProductoFields
    }
  }
  ${PRODUCTO_FIELDS}
`;

export const TOP_PRODUCTOS_MOVIDOS = gql`
  query TopProductosMovidos($limite: Int, $dias: Int, $almacenId: ID) {
    topProductosMovidos(limite: $limite, dias: $dias, almacenId: $almacenId) {
      producto {
        _id
        codigo
        nombre
        categoria
        stock
        estadoStock
      }
      totalMovimientos
      totalCantidad
    }
  }
`;

export const REPORTE_INVENTARIO = gql`
  query ReporteInventario($almacenId: ID) {
    reporteInventario(almacenId: $almacenId) {
      totalProductos
      valorTotal
      porCategoria {
        categoria
        cantidadProductos
        valorTotal
      }
    }
  }
`;
