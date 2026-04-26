import 'dotenv/config';
import Joi from 'joi';

interface EnvVars {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
}

const envSchema = Joi.object<EnvVars>({
  PORT: Joi.number().default(4000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  console.error('Variables de entorno inválidas:');
  error.details.forEach((d) => console.error(`  - ${d.message}`));
  process.exit(1);
}

const validated = value as EnvVars;

export const env = {
  port: validated.PORT,
  nodeEnv: validated.NODE_ENV,
  mongoUri: validated.MONGODB_URI,
  jwtSecret: validated.JWT_SECRET,
  jwtExpiresIn: validated.JWT_EXPIRES_IN,
  frontendUrl: validated.FRONTEND_URL,
  isProduction: validated.NODE_ENV === 'production',
  isDevelopment: validated.NODE_ENV === 'development',
} as const;
