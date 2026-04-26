import Joi from 'joi';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import {
  DuplicateKeyError,
  InvalidCredentialsError,
  ValidationError,
} from '../utils/errors';
import { Rol, UsuarioDocument } from '../models/Usuario';

export interface LoginResult {
  token: string;
  usuario: UsuarioDocument;
}

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
}

const crearUsuarioSchema = Joi.object<CrearUsuarioInput>({
  nombre: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  rol: Joi.string().valid('ADMIN', 'OPERADOR').default('OPERADOR'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export class AuthService {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const { error, value } = loginSchema.validate({ email, password });
    if (error) throw new ValidationError(error.message, error.details);

    const usuario = await this.usuarioRepo.findByEmail(value.email);
    if (!usuario || !usuario.activo) {
      throw new InvalidCredentialsError();
    }

    const ok = await comparePassword(value.password, usuario.passwordHash);
    if (!ok) throw new InvalidCredentialsError();

    const token = signToken({
      sub: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol as Rol,
    });

    return { token, usuario };
  }

  async crearUsuario(input: CrearUsuarioInput): Promise<UsuarioDocument> {
    const { error, value } = crearUsuarioSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(error.message, error.details);

    const exists = await this.usuarioRepo.existsByEmail(value.email);
    if (exists) throw new DuplicateKeyError('email');

    const passwordHash = await hashPassword(value.password);

    return this.usuarioRepo.create({
      nombre: value.nombre,
      email: value.email,
      passwordHash,
      rol: value.rol ?? 'OPERADOR',
    });
  }
}
