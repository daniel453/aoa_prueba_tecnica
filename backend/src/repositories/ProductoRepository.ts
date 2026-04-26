import { ClientSession, FilterQuery, PipelineStage, Types } from 'mongoose';
import { ProductoModel, ProductoDocument, EstadoStock } from '../models/Producto';
import { buildPage, getSkipLimit, Page } from '../utils/pagination';

export interface ProductoFilter {
  busqueda?: string;
  categoria?: string;
  estadoStock?: EstadoStock;
  activo?: boolean;
  /** Si esta presente, los filtros estadoStock y count se aplican
   *  contra el stock de este almacen, no el global. */
  almacenId?: string;
}

export interface CrearProductoData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  precioPromedio: number;
  stock: number;
}

export type ActualizarProductoData = Partial<
  Pick<CrearProductoData, 'nombre' | 'descripcion' | 'categoria' | 'stockMinimo' | 'precioCompra' | 'precioVenta'>
>;

export class ProductoRepository {
  findById(id: string, session?: ClientSession) {
    return ProductoModel.findById(id)
      .populate('stockPorAlmacen.almacen')
      .session(session ?? null)
      .exec();
  }

  findByCodigo(codigo: string, session?: ClientSession) {
    return ProductoModel.findOne({ codigo: codigo.toUpperCase().trim() })
      .populate('stockPorAlmacen.almacen')
      .session(session ?? null)
      .exec();
  }

  async paginate(
    filter: ProductoFilter,
    page = 1,
    pageSize = 10,
  ): Promise<Page<ProductoDocument>> {
    const { skip, limit, page: p, pageSize: ps } = getSkipLimit(page, pageSize);

    if (filter.almacenId) {
      return this.paginateScopedToAlmacen(filter, skip, limit, p, ps);
    }

    const query = this.buildQuery(filter);
    const [items, total] = await Promise.all([
      ProductoModel.find(query)
        .populate('stockPorAlmacen.almacen')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ProductoModel.countDocuments(query),
    ]);
    return buildPage(items, total, p, ps);
  }

  /**
   * Pipeline de agregacion para listar productos con filtro por almacen.
   * Computa el stock efectivo en ese almacen via $filter sobre stockPorAlmacen
   * y aplica el filtro de estadoStock contra ese valor.
   */
  private async paginateScopedToAlmacen(
    filter: ProductoFilter,
    skip: number,
    limit: number,
    page: number,
    pageSize: number,
  ): Promise<Page<ProductoDocument>> {
    const aId = new Types.ObjectId(filter.almacenId!);

    const baseMatch: Record<string, unknown> = { activo: filter.activo ?? true };
    if (filter.categoria) baseMatch.categoria = filter.categoria;
    if (filter.busqueda) {
      const escaped = filter.busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      baseMatch.$or = [{ codigo: regex }, { nombre: regex }, { descripcion: regex }];
    }

    // Computa stockEfectivo y stockMinEfectivo (del almacen seleccionado).
    const addFields = {
      $addFields: {
        _stockEntry: {
          $first: {
            $filter: {
              input: '$stockPorAlmacen',
              cond: { $eq: ['$$this.almacen', aId] },
            },
          },
        },
      },
    };
    const projectEffective = {
      $addFields: {
        _stockEfectivo: { $ifNull: ['$_stockEntry.stock', 0] },
        _stockMinEfectivo: {
          $cond: [
            { $gt: ['$_stockEntry.stockMinimo', 0] },
            '$_stockEntry.stockMinimo',
            '$stockMinimo',
          ],
        },
      },
    };

    const estadoMatch: Record<string, unknown> = {};
    if (filter.estadoStock === 'AGOTADO') {
      estadoMatch.$expr = { $eq: ['$_stockEfectivo', 0] };
    } else if (filter.estadoStock === 'BAJO') {
      estadoMatch.$expr = {
        $and: [
          { $gt: ['$_stockEfectivo', 0] },
          { $lte: ['$_stockEfectivo', '$_stockMinEfectivo'] },
        ],
      };
    } else if (filter.estadoStock === 'OK') {
      estadoMatch.$expr = {
        $gt: ['$_stockEfectivo', '$_stockMinEfectivo'],
      };
    }

    const pipeline: PipelineStage[] = [
      { $match: baseMatch },
      addFields,
      projectEffective,
    ];
    if (Object.keys(estadoMatch).length > 0) {
      pipeline.push({ $match: estadoMatch });
    }

    const [items, totalAgg] = await Promise.all([
      ProductoModel.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { _stockEntry: 0, _stockEfectivo: 0, _stockMinEfectivo: 0 } },
      ] as PipelineStage[]),
      ProductoModel.aggregate([
        ...pipeline,
        { $count: 'total' },
      ] as PipelineStage[]),
    ]);

    // Hidratamos para que populate funcione (aggregate no popula automaticamente)
    const ids = items.map((i: { _id: Types.ObjectId }) => i._id);
    const hydrated = await ProductoModel.find({ _id: { $in: ids } })
      .populate('stockPorAlmacen.almacen')
      .exec();
    // Preservamos el orden del aggregate
    const byId = new Map(hydrated.map((d) => [d._id.toString(), d]));
    const sorted = ids
      .map((id: Types.ObjectId) => byId.get(id.toString()))
      .filter((d): d is ProductoDocument => Boolean(d));

    const total = (totalAgg[0] as { total: number } | undefined)?.total ?? 0;
    return buildPage(sorted, total, page, pageSize);
  }

  async listStockBajo(almacenId?: string): Promise<ProductoDocument[]> {
    if (almacenId) {
      const items = await this.aggregateWithAlmacenStock(almacenId, [
        {
          $match: {
            $expr: { $lte: ['$_stockEfectivo', '$_stockMinEfectivo'] },
          },
        },
        { $sort: { _stockEfectivo: 1 } },
      ]);
      return items;
    }
    return ProductoModel.find({
      activo: true,
      $expr: { $lte: ['$stock', '$stockMinimo'] },
    })
      .populate('stockPorAlmacen.almacen')
      .sort({ stock: 1 })
      .exec();
  }

  async countByEstadoStock(
    estado: EstadoStock,
    almacenId?: string,
  ): Promise<number> {
    if (almacenId) {
      const expr =
        estado === 'AGOTADO'
          ? { $eq: ['$_stockEfectivo', 0] }
          : estado === 'BAJO'
            ? {
                $and: [
                  { $gt: ['$_stockEfectivo', 0] },
                  { $lte: ['$_stockEfectivo', '$_stockMinEfectivo'] },
                ],
              }
            : { $gt: ['$_stockEfectivo', '$_stockMinEfectivo'] };
      const result = await this.aggregateWithAlmacenStockCount(almacenId, [
        { $match: { $expr: expr } },
      ]);
      return result;
    }
    if (estado === 'AGOTADO') {
      return ProductoModel.countDocuments({ activo: true, stock: 0 }).exec();
    }
    if (estado === 'BAJO') {
      return ProductoModel.countDocuments({
        activo: true,
        $expr: {
          $and: [{ $lte: ['$stock', '$stockMinimo'] }, { $gt: ['$stock', 0] }],
        },
      }).exec();
    }
    return ProductoModel.countDocuments({
      activo: true,
      $expr: { $gt: ['$stock', '$stockMinimo'] },
    }).exec();
  }

  /** Helpers privados de aggregate compartidos para reportes per-almacen */
  private buildAlmacenStockStages(
    almacenId: string,
  ): PipelineStage[] {
    const aId = new Types.ObjectId(almacenId);
    return [
      { $match: { activo: true } },
      {
        $addFields: {
          _stockEntry: {
            $first: {
              $filter: {
                input: '$stockPorAlmacen',
                cond: { $eq: ['$$this.almacen', aId] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          _stockEfectivo: { $ifNull: ['$_stockEntry.stock', 0] },
          _stockMinEfectivo: {
            $cond: [
              { $gt: ['$_stockEntry.stockMinimo', 0] },
              '$_stockEntry.stockMinimo',
              '$stockMinimo',
            ],
          },
        },
      },
    ];
  }

  private async aggregateWithAlmacenStock(
    almacenId: string,
    extraStages: PipelineStage[],
  ): Promise<ProductoDocument[]> {
    const stages = [
      ...this.buildAlmacenStockStages(almacenId),
      ...extraStages,
    ] as PipelineStage[];
    const raw = await ProductoModel.aggregate(stages);
    const ids = raw.map((r: { _id: Types.ObjectId }) => r._id);
    const hydrated = await ProductoModel.find({ _id: { $in: ids } })
      .populate('stockPorAlmacen.almacen')
      .exec();
    const byId = new Map(hydrated.map((d) => [d._id.toString(), d]));
    return ids
      .map((id: Types.ObjectId) => byId.get(id.toString()))
      .filter((d): d is ProductoDocument => Boolean(d));
  }

  private async aggregateWithAlmacenStockCount(
    almacenId: string,
    extraStages: PipelineStage[],
  ): Promise<number> {
    const stages = [
      ...this.buildAlmacenStockStages(almacenId),
      ...extraStages,
      { $count: 'total' },
    ] as PipelineStage[];
    const raw = await ProductoModel.aggregate(stages);
    return (raw[0] as { total: number } | undefined)?.total ?? 0;
  }

  countActive(): Promise<number> {
    return ProductoModel.countDocuments({ activo: true }).exec();
  }

  categorias(): Promise<string[]> {
    return ProductoModel.distinct('categoria', { activo: true }).exec();
  }

  async sumValorInventario(almacenId?: string): Promise<number> {
    if (almacenId) {
      const stages = [
        ...this.buildAlmacenStockStages(almacenId),
        {
          $group: {
            _id: null,
            total: {
              $sum: { $multiply: ['$_stockEfectivo', '$precioPromedio'] },
            },
          },
        },
      ] as PipelineStage[];
      const result = await ProductoModel.aggregate<{ total: number }>(stages);
      return result[0]?.total ?? 0;
    }
    const result = await ProductoModel.aggregate<{ total: number }>([
      { $match: { activo: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$precioPromedio'] } } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async resumenPorCategoria(
    almacenId?: string,
  ): Promise<
    Array<{ categoria: string; cantidadProductos: number; valorTotal: number }>
  > {
    if (almacenId) {
      const stages = [
        ...this.buildAlmacenStockStages(almacenId),
        {
          $group: {
            _id: '$categoria',
            cantidadProductos: { $sum: 1 },
            valorTotal: {
              $sum: { $multiply: ['$_stockEfectivo', '$precioPromedio'] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            categoria: '$_id',
            cantidadProductos: 1,
            valorTotal: 1,
          },
        },
        { $sort: { categoria: 1 } },
      ] as PipelineStage[];
      return ProductoModel.aggregate(stages);
    }
    return ProductoModel.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: '$categoria',
          cantidadProductos: { $sum: 1 },
          valorTotal: { $sum: { $multiply: ['$stock', '$precioPromedio'] } },
        },
      },
      { $project: { _id: 0, categoria: '$_id', cantidadProductos: 1, valorTotal: 1 } },
      { $sort: { categoria: 1 } },
    ]);
  }

  async create(data: CrearProductoData, session?: ClientSession): Promise<ProductoDocument> {
    const [doc] = await ProductoModel.create([data], { session });
    return doc;
  }

  updateById(id: string, data: ActualizarProductoData, session?: ClientSession) {
    return ProductoModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      session,
    }).exec();
  }

  /**
   * Actualiza el stock del almacen indicado dentro de stockPorAlmacen y
   * recalcula el total agregado del producto (suma de todos los almacenes).
   * Si el almacen aun no tiene entrada, se crea.
   */
  async updateStockAndPrice(
    id: string,
    update: {
      almacenId: string;
      nuevoStockEnAlmacen: number;
      precioPromedio?: number;
      precioCompra?: number;
    },
    session: ClientSession,
  ): Promise<ProductoDocument | null> {
    const doc = await ProductoModel.findById(id).session(session).exec();
    if (!doc) return null;

    const target = update.almacenId.toString();
    const entry = doc.stockPorAlmacen.find((s) => {
      const ref = s.almacen as unknown as
        | { _id: { toString: () => string } }
        | { toString: () => string };
      const id =
        '_id' in ref && ref._id ? ref._id.toString() : ref.toString();
      return id === target;
    });
    if (entry) {
      entry.stock = update.nuevoStockEnAlmacen;
    } else {
      doc.stockPorAlmacen.push({
        almacen: new Types.ObjectId(update.almacenId),
        stock: update.nuevoStockEnAlmacen,
        stockMinimo: 0,
      });
    }

    doc.stock = doc.stockPorAlmacen.reduce((sum, s) => sum + s.stock, 0);

    if (update.precioPromedio !== undefined) doc.precioPromedio = update.precioPromedio;
    if (update.precioCompra !== undefined) doc.precioCompra = update.precioCompra;

    await doc.save({ session });
    return doc;
  }

  /** Lee el stock del producto en un almacen especifico. 0 si no existe entrada.
   *  Soporta tanto referencias populadas como ObjectId crudo. */
  static stockEnAlmacen(producto: ProductoDocument, almacenId: string): number {
    const target = almacenId.toString();
    const entry = producto.stockPorAlmacen.find((s) => {
      const ref = s.almacen as unknown as
        | { _id: { toString: () => string } }
        | { toString: () => string };
      const id =
        '_id' in ref && ref._id ? ref._id.toString() : ref.toString();
      return id === target;
    });
    return entry?.stock ?? 0;
  }

  softDelete(id: string) {
    return ProductoModel.findByIdAndUpdate(id, { activo: false }, { new: true }).exec();
  }

  restore(id: string) {
    return ProductoModel.findByIdAndUpdate(id, { activo: true }, { new: true }).exec();
  }

  private buildQuery(filter: ProductoFilter): FilterQuery<ProductoDocument> {
    const q: FilterQuery<ProductoDocument> = {};
    q.activo = filter.activo ?? true;

    if (filter.categoria) {
      q.categoria = filter.categoria;
    }

    if (filter.busqueda) {
      const escaped = filter.busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      q.$or = [{ codigo: regex }, { nombre: regex }, { descripcion: regex }];
    }

    // estadoStock global (path sin almacenId)
    if (filter.estadoStock === 'AGOTADO') {
      q.stock = 0;
    } else if (filter.estadoStock === 'BAJO') {
      q.$expr = {
        $and: [{ $lte: ['$stock', '$stockMinimo'] }, { $gt: ['$stock', 0] }],
      };
    } else if (filter.estadoStock === 'OK') {
      q.$expr = { $gt: ['$stock', '$stockMinimo'] };
    }

    return q;
  }
}
