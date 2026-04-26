import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

const AlmacenSchema = new Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    direccion: { type: String, default: '', trim: true, maxlength: 200 },
    activo: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

AlmacenSchema.index({ activo: 1 });

export type Almacen = InferSchemaType<typeof AlmacenSchema>;
export type AlmacenDocument = HydratedDocument<Almacen>;
export const AlmacenModel = model<Almacen>('Almacen', AlmacenSchema);
