import { Schema, model, HydratedDocument, InferSchemaType, Types } from 'mongoose';

export const TIPOS_MOVIMIENTO = ['ENTRADA', 'SALIDA'] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

const MovimientoSchema = new Schema(
  {
    producto: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    almacen: { type: Schema.Types.ObjectId, ref: 'Almacen', required: true },
    tipo: { type: String, enum: TIPOS_MOVIMIENTO, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    // stockAntes/stockDespues son del almacen especifico, no del global
    stockAntes: { type: Number, required: true, min: 0 },
    stockDespues: { type: Number, required: true, min: 0 },
    observacion: { type: String, default: '', trim: true, maxlength: 500 },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true },
);

// Compuestos para queries de kardex y reportes
MovimientoSchema.index({ producto: 1, createdAt: -1 });
MovimientoSchema.index({ producto: 1, almacen: 1, createdAt: -1 });
MovimientoSchema.index({ almacen: 1, createdAt: -1 });
MovimientoSchema.index({ tipo: 1, createdAt: -1 });
MovimientoSchema.index({ usuario: 1, createdAt: -1 });
MovimientoSchema.index({ createdAt: -1 });

export type Movimiento = InferSchemaType<typeof MovimientoSchema>;
export type MovimientoDocument = HydratedDocument<Movimiento>;
export const MovimientoModel = model<Movimiento>('Movimiento', MovimientoSchema);

export { Types };
