import { UsuarioRepository } from './repositories/UsuarioRepository';
import { ProductoRepository } from './repositories/ProductoRepository';
import { MovimientoRepository } from './repositories/MovimientoRepository';
import { AlmacenRepository } from './repositories/AlmacenRepository';
import { AuthService } from './services/AuthService';
import { ProductoService } from './services/ProductoService';
import { MovimientoService } from './services/MovimientoService';
import { ReporteService } from './services/ReporteService';
import { AlmacenService } from './services/AlmacenService';

/**
 * Container de inyeccion de dependencias.
 * Construye una unica instancia de cada repository y service y la expone
 * via el context de GraphQL para que los resolvers puedan usarlas.
 *
 * Esto desacopla la logica de negocio de la creacion de objetos
 * y facilita el testing (se puede instanciar Container con repos mockeados).
 */
export interface Repositories {
  usuario: UsuarioRepository;
  producto: ProductoRepository;
  movimiento: MovimientoRepository;
  almacen: AlmacenRepository;
}

export interface Services {
  auth: AuthService;
  producto: ProductoService;
  movimiento: MovimientoService;
  reporte: ReporteService;
  almacen: AlmacenService;
}

export interface Container {
  repositories: Repositories;
  services: Services;
}

export function buildContainer(): Container {
  const repositories: Repositories = {
    usuario: new UsuarioRepository(),
    producto: new ProductoRepository(),
    movimiento: new MovimientoRepository(),
    almacen: new AlmacenRepository(),
  };

  const services: Services = {
    auth: new AuthService(repositories.usuario),
    producto: new ProductoService(repositories.producto),
    movimiento: new MovimientoService(
      repositories.producto,
      repositories.movimiento,
      repositories.almacen,
    ),
    reporte: new ReporteService(repositories.producto, repositories.movimiento),
    almacen: new AlmacenService(repositories.almacen),
  };

  return { repositories, services };
}
