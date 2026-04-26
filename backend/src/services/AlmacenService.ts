import Joi from 'joi';
import { AlmacenRepository, CrearAlmacenData } from '../repositories/AlmacenRepository';
import { AlmacenDocument } from '../models/Almacen';
import {
  BusinessRuleError,
  DuplicateKeyError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';

const crearSchema = Joi.object<CrearAlmacenData>({
  codigo: Joi.string().trim().min(2).max(30).required(),
  nombre: Joi.string().trim().min(2).max(100).required(),
  direccion: Joi.string().trim().allow('').max(200).default(''),
});

const actualizarSchema = Joi.object({
  nombre: Joi.string().trim().min(2).max(100),
  direccion: Joi.string().trim().allow('').max(200),
}).min(1);

export class AlmacenService {
  constructor(private readonly repo: AlmacenRepository) {}

  list(activo?: boolean) {
    return this.repo.list(activo);
  }

  async obtener(id: string): Promise<AlmacenDocument> {
    const a = await this.repo.findById(id);
    if (!a) throw new NotFoundError('Almacen', id);
    return a;
  }

  async crear(input: CrearAlmacenData): Promise<AlmacenDocument> {
    const { error, value } = crearSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(error.message, error.details);

    const existing = await this.repo.findByCodigo(value.codigo);
    if (existing) throw new DuplicateKeyError('codigo de almacen');

    return this.repo.create(value);
  }

  async actualizar(
    id: string,
    input: Record<string, unknown>,
  ): Promise<AlmacenDocument> {
    const { error, value } = actualizarSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(error.message, error.details);

    const updated = await this.repo.update(id, value);
    if (!updated) throw new NotFoundError('Almacen', id);
    return updated;
  }

  async eliminar(id: string): Promise<AlmacenDocument> {
    const total = await this.repo.count();
    if (total <= 1) {
      throw new BusinessRuleError(
        'Debe existir al menos un almacen activo en el sistema',
      );
    }
    const updated = await this.repo.setActivo(id, false);
    if (!updated) throw new NotFoundError('Almacen', id);
    return updated;
  }

  async restaurar(id: string): Promise<AlmacenDocument> {
    const updated = await this.repo.setActivo(id, true);
    if (!updated) throw new NotFoundError('Almacen', id);
    return updated;
  }
}
