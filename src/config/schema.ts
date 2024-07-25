import { z } from 'zod';
import { isValidTimeSpan } from './validators/jwtTimeSpan';

export const validationSchema = z.object({
  JWT_ACCESS_EXPIRES: z.string().transform(isValidTimeSpan),
  JWT_ACCESS_SECRET: z.string().base64().min(20),
  JWT_REFRESH_EXPIRES: z.string().transform(isValidTimeSpan),
  JWT_REFRESH_SECRET: z.string().base64().min(20),
  PORT: z.coerce.number().gte(1024).lte(65535),
  MONGODB_HOST: z.string().default('mongo'),
  MONGODB_PORT: z.coerce.number().gte(1024).lte(65535).default(27017),
  MONGODB_NAME: z.string(),
  MONGODB_USER: z.string(),
  MONGODB_PASSWORD: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export type AppConfig = z.output<typeof validationSchema>;
