import { ClientSession } from 'mongoose';
import { UsuarioModel, UsuarioDocument, Rol } from '../models/Usuario';

export interface CrearUsuarioData {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

export class UsuarioRepository {
  findById(id: string, session?: ClientSession) {
    return UsuarioModel.findById(id).session(session ?? null).exec();
  }

  findByEmail(email: string, session?: ClientSession) {
    return UsuarioModel.findOne({ email: email.toLowerCase().trim() })
      .session(session ?? null)
      .exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const r = await UsuarioModel.exists({ email: email.toLowerCase().trim() });
    return r !== null;
  }

  async create(data: CrearUsuarioData, session?: ClientSession): Promise<UsuarioDocument> {
    const [doc] = await UsuarioModel.create([data], { session });
    return doc;
  }

  countAdmins(): Promise<number> {
    return UsuarioModel.countDocuments({ rol: 'ADMIN', activo: true }).exec();
  }
}
