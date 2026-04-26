import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

export type EstadoStock = 'OK' | 'BAJO' | 'AGOTADO';

/**
 * Subdoc que mantiene stock y stockMinimo por almacen.
 * El campo stock/stockMinimo de Producto sigue existiendo como TOTAL agregado
 * (suma de todos los almacenes) para que las queries existentes y los
 * reportes globales sigan funcionando sin cambios.
 */
const StockEnAlmacenSchema = new Schema(
  {
    almacen: {
      type: Schema.Types.ObjectId,
      ref: 'Almacen',
      required: true,
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    stockMinimo: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false },
);

const ProductoSchema = new Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    nombre: { type: String, required: true, trim: true, maxlength: 200 },
    descripcion: { type: String, default: '', trim: true },
    categoria: { type: String, required: true, trim: true, maxlength: 100 },
    // stock y stockMinimo son AGREGADOS (sumas) calculados por el service
    // tras cada movimiento. Persisten en el doc para queries rapidas.
    stock: { type: Number, required: true, default: 0, min: 0 },
    stockMinimo: { type: Number, required: true, default: 0, min: 0 },
    stockPorAlmacen: { type: [StockEnAlmacenSchema], default: [] },
    precioCompra: { type: Number, required: true, min: 0 },
    precioVenta: { type: Number, required: true, min: 0 },
    precioPromedio: { type: Number, required: true, default: 0, min: 0 },
    activo: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Índices adicionales (codigo ya tiene unique)
ProductoSchema.index({ categoria: 1, activo: 1 });
ProductoSchema.index({ stock: 1 });
ProductoSchema.index({ nombre: 'text', descripcion: 'text' });
ProductoSchema.index({ 'stockPorAlmacen.almacen': 1 });

ProductoSchema.virtual('estadoStock').get(function (): EstadoStock {
  if (this.stock === 0) return 'AGOTADO';
  if (this.stock <= this.stockMinimo) return 'BAJO';
  return 'OK';
});

export type Producto = InferSchemaType<typeof ProductoSchema>;
export type ProductoDocument = HydratedDocument<Producto>;
export const ProductoModel = model<Producto>('Producto', ProductoSchema);

/**
 * Calcula el estado de stock a partir de los valores actuales.
 * Se usa desde resolvers como campo derivado y en reportes/dashboard.
 */
export function calcularEstadoStock(stock: number, stockMinimo: number): EstadoStock {
  if (stock === 0) return 'AGOTADO';
  if (stock <= stockMinimo) return 'BAJO';
  return 'OK';
}
