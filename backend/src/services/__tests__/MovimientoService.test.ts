import { Types } from 'mongoose';
import { MovimientoService } from '../MovimientoService';
import {
  BusinessRuleError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors';

/**
 * Mock de mongoose.startSession para simular session.withTransaction.
 * En tests no queremos golpear Mongo, asi que ejecutamos el callback
 * directamente como si la transaccion fuese un await comun.
 */
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn().mockResolvedValue({
      withTransaction: async (cb: () => Promise<void>) => {
        await cb();
      },
      endSession: jest.fn(),
    }),
  };
});

const VALID_PROD_ID = new Types.ObjectId().toHexString();
const ALMACEN_ID = new Types.ObjectId().toHexString();
const USUARIO_ID = new Types.ObjectId().toHexString();

function makeProducto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new Types.ObjectId(VALID_PROD_ID),
    codigo: 'TEST-001',
    nombre: 'Producto de prueba',
    stock: 10,
    stockMinimo: 5,
    stockPorAlmacen: [
      { almacen: new Types.ObjectId(ALMACEN_ID), stock: 10, stockMinimo: 5 },
    ],
    precioCompra: 100,
    precioVenta: 150,
    precioPromedio: 100,
    activo: true,
    ...overrides,
  };
}

function makeAlmacen(activo = true) {
  return {
    _id: new Types.ObjectId(ALMACEN_ID),
    codigo: 'PRINCIPAL',
    nombre: 'Almacen principal',
    activo,
  };
}

function buildService(opts: {
  producto?: ReturnType<typeof makeProducto> | null;
  almacen?: ReturnType<typeof makeAlmacen> | null;
  movimientoCreado?: { _id: { toString: () => string } };
}) {
  const productoResolved = 'producto' in opts ? opts.producto : makeProducto();
  const almacenResolved = 'almacen' in opts ? opts.almacen : makeAlmacen();

  const productoRepo = {
    findById: jest.fn().mockResolvedValue(productoResolved),
    updateStockAndPrice: jest.fn().mockResolvedValue(undefined),
  };
  const movimientoRepo = {
    create: jest.fn().mockResolvedValue(
      opts.movimientoCreado ?? {
        _id: { toString: () => 'mov-id-1' },
      },
    ),
    findById: jest.fn().mockResolvedValue({
      _id: 'mov-id-1',
      tipo: 'ENTRADA',
      cantidad: 5,
    }),
  };
  const almacenRepo = {
    findById: jest.fn().mockResolvedValue(almacenResolved),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = new MovimientoService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productoRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    movimientoRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    almacenRepo as any,
  );
  return { svc, productoRepo, movimientoRepo, almacenRepo };
}

describe('MovimientoService.registrarEntrada', () => {
  const baseInput = {
    productoId: VALID_PROD_ID,
    almacenId: ALMACEN_ID,
  };

  it('actualiza stock + precio promedio + crea movimiento atomicamente', async () => {
    const { svc, productoRepo, movimientoRepo } = buildService({
      producto: makeProducto({ stock: 10, precioPromedio: 100 }),
    });

    await svc.registrarEntrada(
      { ...baseInput, cantidad: 5, precioUnitario: 150 },
      USUARIO_ID,
    );

    // updateStockAndPrice recibe stock nuevo del almacen + precio promedio recalculado
    expect(productoRepo.updateStockAndPrice).toHaveBeenCalledTimes(1);
    const updateCall = productoRepo.updateStockAndPrice.mock.calls[0][1];
    expect(updateCall.almacenId).toBe(ALMACEN_ID);
    expect(updateCall.nuevoStockEnAlmacen).toBe(15); // 10 + 5
    expect(updateCall.precioPromedio).toBeCloseTo(116.6667, 3);
    expect(updateCall.precioCompra).toBe(150);

    expect(movimientoRepo.create).toHaveBeenCalledTimes(1);
    const movArg = movimientoRepo.create.mock.calls[0][0];
    expect(movArg.tipo).toBe('ENTRADA');
    expect(movArg.cantidad).toBe(5);
    expect(movArg.stockAntes).toBe(10);
    expect(movArg.stockDespues).toBe(15);
    expect(movArg.almacen).toBeDefined();
    expect(movArg.usuario).toBe(USUARIO_ID);
  });

  it('reinicia precio promedio cuando stock global = 0', async () => {
    const { svc, productoRepo } = buildService({
      producto: makeProducto({
        stock: 0,
        precioPromedio: 200,
        stockPorAlmacen: [],
      }),
    });

    await svc.registrarEntrada(
      { ...baseInput, cantidad: 8, precioUnitario: 50 },
      USUARIO_ID,
    );

    const updateCall = productoRepo.updateStockAndPrice.mock.calls[0][1];
    expect(updateCall.nuevoStockEnAlmacen).toBe(8);
    expect(updateCall.precioPromedio).toBe(50);
  });

  it('lanza NotFoundError si el producto no existe', async () => {
    const { svc } = buildService({ producto: null });

    await expect(
      svc.registrarEntrada(
        { ...baseInput, cantidad: 1, precioUnitario: 10 },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza NotFoundError si el almacen no existe', async () => {
    const { svc } = buildService({ almacen: null });

    await expect(
      svc.registrarEntrada(
        { ...baseInput, cantidad: 1, precioUnitario: 10 },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza BusinessRuleError sobre producto inactivo', async () => {
    const { svc } = buildService({
      producto: makeProducto({ activo: false }),
    });

    await expect(
      svc.registrarEntrada(
        { ...baseInput, cantidad: 1, precioUnitario: 10 },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('lanza BusinessRuleError sobre almacen inactivo', async () => {
    const { svc } = buildService({ almacen: makeAlmacen(false) });

    await expect(
      svc.registrarEntrada(
        { ...baseInput, cantidad: 1, precioUnitario: 10 },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });
});

describe('MovimientoService.registrarSalida', () => {
  const baseInput = {
    productoId: VALID_PROD_ID,
    almacenId: ALMACEN_ID,
  };

  it('descuenta stock SIN modificar precio promedio', async () => {
    const { svc, productoRepo } = buildService({
      producto: makeProducto({
        stock: 20,
        precioPromedio: 100,
        stockPorAlmacen: [
          { almacen: new Types.ObjectId(ALMACEN_ID), stock: 20, stockMinimo: 0 },
        ],
      }),
    });

    await svc.registrarSalida(
      { ...baseInput, cantidad: 5, precioUnitario: 200 },
      USUARIO_ID,
    );

    const updateCall = productoRepo.updateStockAndPrice.mock.calls[0][1];
    expect(updateCall.nuevoStockEnAlmacen).toBe(15);
    expect(updateCall.precioPromedio).toBeUndefined();
    expect(updateCall.precioCompra).toBeUndefined();
  });

  it('lanza InsufficientStockError si cantidad > stock del almacen', async () => {
    const { svc, productoRepo, movimientoRepo } = buildService({
      producto: makeProducto({
        stock: 3,
        stockPorAlmacen: [
          { almacen: new Types.ObjectId(ALMACEN_ID), stock: 3, stockMinimo: 0 },
        ],
      }),
    });

    await expect(
      svc.registrarSalida(
        { ...baseInput, cantidad: 10, precioUnitario: 50 },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    expect(productoRepo.updateStockAndPrice).not.toHaveBeenCalled();
    expect(movimientoRepo.create).not.toHaveBeenCalled();
  });

  it('permite salida exacta hasta agotar el stock del almacen', async () => {
    const { svc, productoRepo } = buildService({
      producto: makeProducto({
        stock: 7,
        stockPorAlmacen: [
          { almacen: new Types.ObjectId(ALMACEN_ID), stock: 7, stockMinimo: 0 },
        ],
      }),
    });

    await svc.registrarSalida(
      { ...baseInput, cantidad: 7, precioUnitario: 100 },
      USUARIO_ID,
    );

    const updateCall = productoRepo.updateStockAndPrice.mock.calls[0][1];
    expect(updateCall.nuevoStockEnAlmacen).toBe(0);
  });
});

describe('MovimientoService - validacion de input (Joi)', () => {
  it('rechaza productoId que no es ObjectId valido', async () => {
    const { svc } = buildService({});
    await expect(
      svc.registrarEntrada(
        {
          productoId: 'no-es-objectid',
          almacenId: ALMACEN_ID,
          cantidad: 1,
          precioUnitario: 1,
        },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza almacenId que no es ObjectId valido', async () => {
    const { svc } = buildService({});
    await expect(
      svc.registrarEntrada(
        {
          productoId: VALID_PROD_ID,
          almacenId: 'no-es-objectid',
          cantidad: 1,
          precioUnitario: 1,
        },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza cantidad < 1', async () => {
    const { svc } = buildService({});
    await expect(
      svc.registrarEntrada(
        {
          productoId: VALID_PROD_ID,
          almacenId: ALMACEN_ID,
          cantidad: 0,
          precioUnitario: 10,
        },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza cantidad no entera', async () => {
    const { svc } = buildService({});
    await expect(
      svc.registrarEntrada(
        {
          productoId: VALID_PROD_ID,
          almacenId: ALMACEN_ID,
          cantidad: 1.5,
          precioUnitario: 10,
        },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza precio negativo', async () => {
    const { svc } = buildService({});
    await expect(
      svc.registrarEntrada(
        {
          productoId: VALID_PROD_ID,
          almacenId: ALMACEN_ID,
          cantidad: 1,
          precioUnitario: -5,
        },
        USUARIO_ID,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
