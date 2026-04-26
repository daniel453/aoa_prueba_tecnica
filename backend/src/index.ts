import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { schema } from './graphql/schema';
import { buildContext, GraphQLContext } from './graphql/context';
import { buildContainer } from './container';
import { formatError } from './middlewares/errorFormatter';

async function bootstrap(): Promise<void> {
  console.log(`[server] iniciando en modo ${env.nodeEnv}`);

  // 1. Conectar a Mongo
  await connectDatabase();

  // 2. Construir container (DI)
  const container = buildContainer();

  // 3. Construir Apollo Server
  // Introspection + landing page local SIEMPRE: deja accesible Apollo
  // Sandbox en /graphql como documentacion viva de la API (entregable
  // de la prueba). Sin el plugin explicito, Apollo elige el landing
  // page "production" cuando NODE_ENV=production (mensaje "Send a POST
  // request..."); con el plugin local forzamos la UI completa siempre.
  // En produccion real conviene deshabilitar ambas y servir SDL estatico.
  const apollo = new ApolloServer<GraphQLContext>({
    schema,
    formatError,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });
  await apollo.start();

  // 4. Express
  const app = express();

  // FRONTEND_URL puede ser un dominio o lista separada por coma.
  // Adicionalmente aceptamos:
  //   - Previews de Vercel (*.vercel.app)
  //   - Same-origin (localhost en dev, *.onrender.com en prod) para que
  //     Apollo Sandbox embebido en /graphql pueda hacer introspeccion.
  const allowList = env.frontendUrl
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const sameOriginPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
    /^https:\/\/[a-z0-9-]+\.onrender\.com$/,
    // Apollo Sandbox embebido (cuando se abre /graphql en el navegador)
    /^https:\/\/sandbox\.embed\.apollographql\.com$/,
    /^https:\/\/studio\.apollographql\.com$/,
  ];

  app.use(
    cors({
      origin: (origin, cb) => {
        // Permitir requests sin Origin (curl, healthchecks)
        if (!origin) return cb(null, true);
        if (allowList.includes(origin)) return cb(null, true);
        if (sameOriginPatterns.some((re) => re.test(origin))) {
          return cb(null, true);
        }
        return cb(new Error(`Origin no permitido por CORS: ${origin}`));
      },
      credentials: true,
    }),
  );

  // Health endpoint para Render / monitoreo
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Apollo middleware (acepta JSON y Authorization header)
  app.use(
    '/graphql',
    express.json({ limit: '1mb' }),
    expressMiddleware<GraphQLContext>(apollo, {
      context: buildContext(container),
    }),
  );

  // 5. Levantar
  const server = app.listen(env.port, () => {
    console.log(`[server] escuchando en http://localhost:${env.port}`);
    console.log(`[server] GraphQL en http://localhost:${env.port}/graphql`);
    console.log(
      `[server] CORS habilitado para ${allowList.join(', ')} + previews vercel.app + same-origin (localhost, onrender.com)`,
    );
  });

  // 6. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[server] recibida senal ${signal}, cerrando...`);
    server.close(() => console.log('[server] HTTP server cerrado'));
    await apollo.stop();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch(async (err) => {
  console.error('[server] error fatal:', err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
