import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  console.log('[mongo] conectado');
});

mongoose.connection.on('error', (err) => {
  console.error('[mongo] error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[mongo] desconectado');
});

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
