import { ClientSession, FilterQuery, Types } from 'mongoose';
import {
  MovimientoModel,
  MovimientoDocument,
  TipoMovimiento,
} from '../models/Movimiento';
import { buildPage, getSkipLimit, Page } from '../utils/pagination';

export interface MovimientoFilter {
  productoId?: string;
  almacenId?: string;
  tipo?: TipoMovimiento;
  desde?: Date;
  hasta?: Date;
}

export interface CrearMovimientoData {
  producto: Types.ObjectId | string;
  almacen: Types.ObjectId | string;
  tipo: TipoMovimiento;
  cantidad: number;
  precioUnitario: number;
  stockAntes: number;
  stockDespues: number;
  observacion?: string;
  usuario: Types.ObjectId | string;
}

export class MovimientoRepository {
  async create(
    data: CrearMovimientoData,
    session: ClientSession,
  ): Promise<MovimientoDocument> {
    const [doc] = await MovimientoModel.create([data], { session });
    return doc;
  }

  findById(id: string) {
    return MovimientoModel.findById(id)
      .populate('producto')
      .populate('almacen')
      .populate('usuario')
      .exec();
  }

  async paginate(
    filter: MovimientoFilter,
    page = 1,
    pageSize = 20,
  ): Promise<Page<MovimientoDocument>> {
    const query = this.buildQuery(filter);
    const { skip, limit, page: p, pageSize: ps } = getSkipLimit(page, pageSize);
    const [items, total] = await Promise.all([
      MovimientoModel.find(query)
        .populate('producto')
        .populate('almacen')
        .populate('usuario')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      MovimientoModel.countDocuments(query),
    ]);
    return buildPage(items, total, p, ps);
  }

  findByProducto(
    productoId: string,
    desde?: Date,
    hasta?: Date,
    almacenId?: string,
  ) {
    const query: FilterQuery<MovimientoDocument> = {
      producto: new Types.ObjectId(productoId),
    };
    if (almacenId) query.almacen = new Types.ObjectId(almacenId);
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) (query.createdAt as Record<string, Date>).$gte = desde;
      if (hasta) (query.createdAt as Record<string, Date>).$lte = hasta;
    }
    return MovimientoModel.find(query)
      .populate('producto')
      .populate('almacen')
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: -1 })
      .exec();
  }

  findRecent(limite = 10, almacenId?: string) {
    const filter: FilterQuery<MovimientoDocument> = {};
    if (almacenId) filter.almacen = new Types.ObjectId(almacenId);
    return MovimientoModel.find(filter)
      .populate('producto')
      .populate('almacen')
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: -1 })
      .limit(limite)
      .exec();
  }

  countToday(almacenId?: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const filter: FilterQuery<MovimientoDocument> = {
      createdAt: { $gte: start },
    };
    if (almacenId) filter.almacen = new Types.ObjectId(almacenId);
    return MovimientoModel.countDocuments(filter).exec();
  }

  async aggregateByDay(
    dias: number,
    almacenId?: string,
  ): Promise<Array<{ fecha: string; entradas: number; salidas: number }>> {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    const matchStage: Record<string, unknown> = { createdAt: { $gte: desde } };
    if (almacenId) matchStage.almacen = new Types.ObjectId(almacenId);

    const raw = await MovimientoModel.aggregate<{
      _id: { fecha: string; tipo: TipoMovimiento };
      total: number;
    }>([
      { $match: matchStage },
      {
        $group: {
          _id: {
            fecha: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            tipo: '$tipo',
          },
          total: { $sum: '$cantidad' },
        },
      },
    ]);

    const map = new Map<string, { fecha: string; entradas: number; salidas: number }>();
    for (const r of raw) {
      const fecha = r._id.fecha;
      const entry = map.get(fecha) ?? { fecha, entradas: 0, salidas: 0 };
      if (r._id.tipo === 'ENTRADA') entry.entradas += r.total;
      else entry.salidas += r.total;
      map.set(fecha, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  async topMovidos(
    limite = 5,
    dias = 30,
    almacenId?: string,
  ): Promise<
    Array<{ producto: unknown; totalMovimientos: number; totalCantidad: number }>
  > {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    const matchStage: Record<string, unknown> = { createdAt: { $gte: desde } };
    if (almacenId) matchStage.almacen = new Types.ObjectId(almacenId);

    return MovimientoModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$producto',
          totalMovimientos: { $sum: 1 },
          totalCantidad: { $sum: '$cantidad' },
        },
      },
      { $sort: { totalCantidad: -1 } },
      { $limit: limite },
      {
        $lookup: {
          from: 'productos',
          localField: '_id',
          foreignField: '_id',
          as: 'producto',
        },
      },
      { $unwind: '$producto' },
      {
        $project: {
          _id: 0,
          producto: 1,
          totalMovimientos: 1,
          totalCantidad: 1,
        },
      },
    ]);
  }

  private buildQuery(filter: MovimientoFilter): FilterQuery<MovimientoDocument> {
    const q: FilterQuery<MovimientoDocument> = {};
    if (filter.productoId) q.producto = new Types.ObjectId(filter.productoId);
    if (filter.almacenId) q.almacen = new Types.ObjectId(filter.almacenId);
    if (filter.tipo) q.tipo = filter.tipo;
    if (filter.desde || filter.hasta) {
      q.createdAt = {};
      if (filter.desde) (q.createdAt as Record<string, Date>).$gte = filter.desde;
      if (filter.hasta) (q.createdAt as Record<string, Date>).$lte = filter.hasta;
    }
    return q;
  }
}
