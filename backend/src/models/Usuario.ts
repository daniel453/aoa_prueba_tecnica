import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

export const ROLES = ['ADMIN', 'OPERADOR'] as const;
export type Rol = (typeof ROLES)[number];

const UsuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'],
    },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ROLES, default: 'OPERADOR' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// El passwordHash nunca se serializa
UsuarioSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export type Usuario = InferSchemaType<typeof UsuarioSchema>;
export type UsuarioDocument = HydratedDocument<Usuario>;
export const UsuarioModel = model<Usuario>('Usuario', UsuarioSchema);
