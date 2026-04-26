/**
 * Script de seed: crea datos iniciales para poder probar el sistema
 * desde cero.
 *
 * Uso: npm run seed
 *
 * IMPORTANTE: borra y recrea las colecciones del proyecto. Solo se debe
 * usar en entornos de desarrollo. Para evitar accidentes en produccion,
 * se aborta si NODE_ENV === 'production'.
 *
 * Estructura:
 *   1. Usuarios: admin + operador
 *   2. Productos: 10 en varias categorias (con stock=0 inicial)
 *   3. Movimientos: ~22 entradas/salidas via MovimientoService
 *      (asegura que el seed sigue la misma logica del kardex real:
 *       transacciones, precio promedio ponderado, validaciones)
 *   4. Backdate de createdAt para distribuir los movimientos en
 *      los ultimos 30 dias y que los charts del dashboard se vean reales.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UsuarioModel, UsuarioDocument } from '../models/Usuario';
import { ProductoModel, ProductoDocument } from '../models/Producto';
import { MovimientoModel } from '../models/Movimiento';
import { AlmacenModel, AlmacenDocument } from '../models/Almacen';
import { hashPassword } from '../utils/bcrypt';
import { buildContainer } from '../container';

interface SeedUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'OPERADOR';
}

interface SeedProducto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
}

interface SeedMovimiento {
  codigo: string;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  precioUnitario: number;
  observacion: string;
  diasAtras: number;
  almacen?: 'PRINCIPAL' | 'NORTE';
}

interface SeedAlmacen {
  codigo: string;
  nombre: string;
  direccion: string;
}

const ALMACENES: SeedAlmacen[] = [
  {
    codigo: 'PRINCIPAL',
    nombre: 'Almacén Principal',
    direccion: 'Calle 100 #15-20, Bogotá',
  },
  {
    codigo: 'NORTE',
    nombre: 'Bodega Norte',
    direccion: 'Av. Norte #200, Bogotá',
  },
];

const USUARIOS: SeedUsuario[] = [
  {
    nombre: 'Administrador',
    email: 'admin@inventario.com',
    password: 'Admin123!',
    rol: 'ADMIN',
  },
  {
    nombre: 'Operador Demo',
    email: 'operador@inventario.com',
    password: 'Operador123!',
    rol: 'OPERADOR',
  },
];

const PRODUCTOS: SeedProducto[] = [
  { codigo: 'ELEC-001', nombre: 'Laptop Dell Inspiron 15', descripcion: 'Laptop 15.6", 16GB RAM, 512GB SSD, Intel i7', categoria: 'Electronica', stockMinimo: 5, precioCompra: 800, precioVenta: 1200 },
  { codigo: 'ELEC-002', nombre: 'Monitor LG 27" UltraGear', descripcion: 'Monitor gaming QHD 144Hz', categoria: 'Electronica', stockMinimo: 3, precioCompra: 350, precioVenta: 499 },
  { codigo: 'ACC-001', nombre: 'Teclado mecanico Logitech G Pro', descripcion: 'Switches GX Blue, retroiluminado RGB', categoria: 'Accesorios', stockMinimo: 10, precioCompra: 80, precioVenta: 130 },
  { codigo: 'ACC-002', nombre: 'Mouse inalambrico Logitech MX Master 3', descripcion: 'Mouse ergonomico recargable', categoria: 'Accesorios', stockMinimo: 8, precioCompra: 65, precioVenta: 99 },
  { codigo: 'ACC-003', nombre: 'Audifonos Sony WH-1000XM5', descripcion: 'Cancelacion de ruido activa, Bluetooth 5.2', categoria: 'Accesorios', stockMinimo: 5, precioCompra: 280, precioVenta: 399 },
  { codigo: 'OFI-001', nombre: 'Silla ergonomica Herman Miller', descripcion: 'Silla de oficina con soporte lumbar ajustable', categoria: 'Mobiliario', stockMinimo: 2, precioCompra: 600, precioVenta: 950 },
  { codigo: 'OFI-002', nombre: 'Escritorio ajustable IKEA Bekant', descripcion: 'Escritorio standing 160x80cm', categoria: 'Mobiliario', stockMinimo: 2, precioCompra: 200, precioVenta: 320 },
  { codigo: 'PAP-001', nombre: 'Resma papel A4 75g', descripcion: 'Paquete de 500 hojas', categoria: 'Papeleria', stockMinimo: 20, precioCompra: 4, precioVenta: 7 },
  { codigo: 'PAP-002', nombre: 'Boligrafo BIC Cristal x12', descripcion: 'Caja de 12 boligrafos azules', categoria: 'Papeleria', stockMinimo: 15, precioCompra: 3, precioVenta: 6 },
  { codigo: 'CAB-001', nombre: 'Cable HDMI 2.1 - 2m', descripcion: 'Soporta 8K@60Hz, 4K@120Hz', categoria: 'Cables', stockMinimo: 12, precioCompra: 8, precioVenta: 15 },
];

/**
 * Movimientos en orden cronologico (mas antiguos primero).
 * Diseno deliberado para que los productos terminen en distintos estados:
 *   - ACC-002 termina en AGOTADO
 *   - ACC-001, PAP-002, CAB-001 terminan en BAJO (stock <= stockMinimo)
 *   - resto en OK
 * Tambien probamos el promedio ponderado: ELEC-001 y PAP-001 tienen entradas
 * con precios distintos.
 */
const MOVIMIENTOS: SeedMovimiento[] = [
  // Compras iniciales (entradas masivas)
  { codigo: 'PAP-001', tipo: 'ENTRADA', cantidad: 100, precioUnitario: 4.0, observacion: 'Compra mensual a proveedor papeleria', diasAtras: 28 },
  { codigo: 'PAP-002', tipo: 'ENTRADA', cantidad: 50, precioUnitario: 3.0, observacion: 'Compra mensual a proveedor papeleria', diasAtras: 28 },
  { codigo: 'ELEC-001', tipo: 'ENTRADA', cantidad: 10, precioUnitario: 800, observacion: 'Lote inicial proveedor Dell', diasAtras: 26 },
  { codigo: 'ELEC-002', tipo: 'ENTRADA', cantidad: 8, precioUnitario: 350, observacion: 'Lote inicial proveedor LG', diasAtras: 26 },
  { codigo: 'ACC-001', tipo: 'ENTRADA', cantidad: 20, precioUnitario: 80, observacion: 'Lote teclados Logitech', diasAtras: 25 },
  { codigo: 'ACC-002', tipo: 'ENTRADA', cantidad: 12, precioUnitario: 65, observacion: 'Lote mouses Logitech', diasAtras: 25 },
  { codigo: 'ACC-003', tipo: 'ENTRADA', cantidad: 8, precioUnitario: 280, observacion: 'Lote audifonos Sony', diasAtras: 25 },
  { codigo: 'OFI-001', tipo: 'ENTRADA', cantidad: 4, precioUnitario: 600, observacion: 'Sillas ergonomicas premium', diasAtras: 24 },
  { codigo: 'OFI-002', tipo: 'ENTRADA', cantidad: 6, precioUnitario: 200, observacion: 'Escritorios ajustables', diasAtras: 24 },
  { codigo: 'CAB-001', tipo: 'ENTRADA', cantidad: 30, precioUnitario: 8, observacion: 'Cables HDMI 2.1', diasAtras: 24 },

  // Salidas (ventas) durante el mes
  { codigo: 'PAP-001', tipo: 'SALIDA', cantidad: 30, precioUnitario: 7.0, observacion: 'Venta a oficinas centrales', diasAtras: 20 },
  { codigo: 'CAB-001', tipo: 'SALIDA', cantidad: 10, precioUnitario: 15, observacion: 'Venta proyecto cliente A', diasAtras: 18 },
  { codigo: 'ELEC-002', tipo: 'SALIDA', cantidad: 3, precioUnitario: 499, observacion: 'Venta cliente corporativo', diasAtras: 16 },
  { codigo: 'ACC-001', tipo: 'SALIDA', cantidad: 8, precioUnitario: 130, observacion: 'Venta a tienda asociada', diasAtras: 14 },
  { codigo: 'ACC-002', tipo: 'SALIDA', cantidad: 12, precioUnitario: 99, observacion: 'Venta promocional', diasAtras: 12 },
  { codigo: 'OFI-001', tipo: 'SALIDA', cantidad: 1, precioUnitario: 950, observacion: 'Venta a cliente final', diasAtras: 10 },
  { codigo: 'PAP-002', tipo: 'SALIDA', cantidad: 40, precioUnitario: 6.0, observacion: 'Venta corporativa', diasAtras: 8 },

  // Reposiciones (entrada con precio distinto -> verificar promedio ponderado)
  { codigo: 'ELEC-001', tipo: 'ENTRADA', cantidad: 5, precioUnitario: 850, observacion: 'Reposicion (precio subio)', diasAtras: 6 },
  { codigo: 'PAP-001', tipo: 'ENTRADA', cantidad: 50, precioUnitario: 4.5, observacion: 'Reposicion mensual', diasAtras: 5 },
  { codigo: 'CAB-001', tipo: 'SALIDA', cantidad: 15, precioUnitario: 15, observacion: 'Venta proyecto cliente B', diasAtras: 4 },
  { codigo: 'ACC-001', tipo: 'SALIDA', cantidad: 7, precioUnitario: 130, observacion: 'Venta', diasAtras: 2 },
  { codigo: 'ELEC-001', tipo: 'SALIDA', cantidad: 2, precioUnitario: 1200, observacion: 'Venta retail', diasAtras: 1 },

  // Bodega Norte: ingreso de stock para mostrar capacidad multi-almacen
  { codigo: 'PAP-001', tipo: 'ENTRADA', cantidad: 50, precioUnitario: 4.2, observacion: 'Lote bodega Norte', diasAtras: 22, almacen: 'NORTE' },
  { codigo: 'CAB-001', tipo: 'ENTRADA', cantidad: 20, precioUnitario: 8, observacion: 'Lote bodega Norte', diasAtras: 21, almacen: 'NORTE' },
  { codigo: 'ACC-001', tipo: 'ENTRADA', cantidad: 10, precioUnitario: 80, observacion: 'Lote bodega Norte', diasAtras: 20, almacen: 'NORTE' },
  { codigo: 'PAP-001', tipo: 'SALIDA', cantidad: 20, precioUnitario: 7, observacion: 'Venta desde bodega Norte', diasAtras: 7, almacen: 'NORTE' },
];

async function seedUsuarios(): Promise<Map<string, UsuarioDocument>> {
  console.log('[seed] limpiando coleccion usuarios...');
  await UsuarioModel.deleteMany({});

  console.log('[seed] creando usuarios...');
  const map = new Map<string, UsuarioDocument>();
  for (const u of USUARIOS) {
    const passwordHash = await hashPassword(u.password);
    const doc = await UsuarioModel.create({
      nombre: u.nombre,
      email: u.email,
      passwordHash,
      rol: u.rol,
      activo: true,
    });
    map.set(u.email, doc);
    console.log(`         + ${u.email} (${u.rol})`);
  }
  return map;
}

async function seedAlmacenes(): Promise<Map<string, AlmacenDocument>> {
  console.log('[seed] limpiando almacenes...');
  await AlmacenModel.deleteMany({});

  console.log('[seed] creando almacenes...');
  const map = new Map<string, AlmacenDocument>();
  for (const a of ALMACENES) {
    const doc = await AlmacenModel.create({ ...a, activo: true });
    map.set(a.codigo, doc);
    console.log(`         + ${a.codigo} (${a.nombre})`);
  }
  return map;
}

async function seedProductos(): Promise<Map<string, ProductoDocument>> {
  console.log('[seed] limpiando productos y movimientos...');
  await Promise.all([
    ProductoModel.deleteMany({}),
    MovimientoModel.deleteMany({}),
  ]);

  console.log('[seed] creando productos...');
  const map = new Map<string, ProductoDocument>();
  for (const p of PRODUCTOS) {
    const doc = await ProductoModel.create({
      ...p,
      stock: 0,
      precioPromedio: 0,
      activo: true,
    });
    map.set(p.codigo, doc);
    console.log(`         + ${p.codigo}`);
  }
  return map;
}

async function seedMovimientos(
  productos: Map<string, ProductoDocument>,
  usuarios: Map<string, UsuarioDocument>,
  almacenes: Map<string, AlmacenDocument>,
): Promise<void> {
  const container = buildContainer();
  const adminId = usuarios.get('admin@inventario.com')!._id.toString();

  console.log('[seed] registrando movimientos via MovimientoService (transaccional)...');
  const idsCreados: string[] = [];

  for (const m of MOVIMIENTOS) {
    const producto = productos.get(m.codigo);
    if (!producto) {
      throw new Error(`Producto ${m.codigo} no encontrado en seed`);
    }
    const almacenCodigo = m.almacen ?? 'PRINCIPAL';
    const almacen = almacenes.get(almacenCodigo);
    if (!almacen) {
      throw new Error(`Almacen ${almacenCodigo} no encontrado en seed`);
    }
    const input = {
      productoId: producto._id.toString(),
      almacenId: almacen._id.toString(),
      cantidad: m.cantidad,
      precioUnitario: m.precioUnitario,
      observacion: m.observacion,
    };
    const doc =
      m.tipo === 'ENTRADA'
        ? await container.services.movimiento.registrarEntrada(input, adminId)
        : await container.services.movimiento.registrarSalida(input, adminId);
    idsCreados.push(doc._id.toString());
    console.log(
      `         + ${m.tipo.padEnd(7)} ${m.codigo.padEnd(9)} ${almacenCodigo.padEnd(9)} cant=${String(m.cantidad).padStart(4)} @${m.precioUnitario}`,
    );
  }

  // Backdate de createdAt usando el driver raw de MongoDB para evitar que
  // los hooks de timestamps de Mongoose 8 sobreescriban nuestros valores.
  console.log('[seed] aplicando timestamps historicos via raw collection...');
  const coll = MovimientoModel.collection;
  for (let i = 0; i < MOVIMIENTOS.length; i++) {
    const m = MOVIMIENTOS[i];
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - m.diasAtras);
    // offset por movimiento para no agrupar a la misma hora
    fecha.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);
    await coll.updateOne(
      { _id: new mongoose.Types.ObjectId(idsCreados[i]) },
      { $set: { createdAt: fecha, updatedAt: fecha } },
    );
  }
}

async function reportarEstadoFinal(): Promise<void> {
  const productos = await ProductoModel.find({ activo: true })
    .sort({ codigo: 1 })
    .exec();

  console.log('[seed] estado final del inventario:');
  console.log(
    '  codigo     stock  min  estado    precioPromedio  valor',
  );
  for (const p of productos) {
    const estado =
      p.stock === 0 ? 'AGOTADO' : p.stock <= p.stockMinimo ? 'BAJO' : 'OK';
    const valor = (p.stock * p.precioPromedio).toFixed(2);
    const promedio = p.precioPromedio.toFixed(2);
    console.log(
      `  ${p.codigo.padEnd(10)} ${String(p.stock).padStart(5)}  ${String(p.stockMinimo).padStart(3)}  ${estado.padEnd(8)}  ${promedio.padStart(13)}  ${valor.padStart(8)}`,
    );
  }

  const [usuarios, productosCount, movimientos] = await Promise.all([
    UsuarioModel.estimatedDocumentCount(),
    ProductoModel.estimatedDocumentCount(),
    MovimientoModel.estimatedDocumentCount(),
  ]);
  console.log(
    `[seed] totales -> usuarios: ${usuarios}, productos: ${productosCount}, movimientos: ${movimientos}`,
  );
}

async function run(): Promise<void> {
  if (env.isProduction) {
    console.error('[seed] abortando: NODE_ENV=production');
    process.exit(1);
  }

  await connectDatabase();

  const usuarios = await seedUsuarios();
  const almacenes = await seedAlmacenes();
  const productos = await seedProductos();
  await seedMovimientos(productos, usuarios, almacenes);
  await reportarEstadoFinal();

  console.log('\n[seed] credenciales de prueba:');
  for (const u of USUARIOS) {
    console.log(`  ${u.rol.padEnd(8)} -> email: ${u.email}  password: ${u.password}`);
  }

  await disconnectDatabase();
  console.log('[seed] OK');
}

run().catch(async (err) => {
  console.error('[seed] error:', err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
