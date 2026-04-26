import { ClientSession } from 'mongoose';
import { AlmacenModel, AlmacenDocument } from '../models/Almacen';

export interface CrearAlmacenData {
  codigo: string;
  nombre: string;
  direccion?: string;
}

export type ActualizarAlmacenData = Partial<
  Pick<CrearAlmacenData, 'nombre' | 'direccion'>
>;

export class AlmacenRepository {
  findById(id: string, session?: ClientSession) {
    return AlmacenModel.findById(id).session(session ?? null).exec();
  }

  findByCodigo(codigo: string, session?: ClientSession) {
    return AlmacenModel.findOne({ codigo: codigo.toUpperCase().trim() })
      .session(session ?? null)
      .exec();
  }

  list(activo?: boolean) {
    const filter: Record<string, unknown> = {};
    if (activo !== undefined) filter.activo = activo;
    return AlmacenModel.find(filter).sort({ codigo: 1 }).exec();
  }

  async create(data: CrearAlmacenData): Promise<AlmacenDocument> {
    const created = await AlmacenModel.create({
      codigo: data.codigo.toUpperCase().trim(),
      nombre: data.nombre.trim(),
      direccion: data.direccion?.trim() ?? '',
    });
    return created;
  }

  update(id: string, data: ActualizarAlmacenData) {
    return AlmacenModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  setActivo(id: string, activo: boolean) {
    return AlmacenModel.findByIdAndUpdate(id, { activo }, { new: true }).exec();
  }

  count() {
    return AlmacenModel.countDocuments({ activo: true }).exec();
  }
}
