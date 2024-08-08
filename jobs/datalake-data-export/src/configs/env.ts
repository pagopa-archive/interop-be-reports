import dotenv from 'dotenv'
import { z } from 'zod'

export const Env = z.object({
  AWS_REGION: z.string(),
  
  READ_MODEL_DB_USER: z.string(),
  READ_MODEL_DB_PASSWORD: z.string(),
  READ_MODEL_DB_HOST: z.string(),
  READ_MODEL_DB_PORT: z.string(),
  READ_MODEL_DB_NAME: z.string(),

  MONGODB_REPLICA_SET: z.string().optional(),
  MONGODB_READ_PREFERENCE: z.string(),
  MONGODB_DIRECT_CONNECTION: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
  MONGODB_RETRY_WRITES: z
    .string()
    .transform((value) => value === 'true')
    .optional(),

  DATALAKE_STORAGE_BUCKET: z.string(),
})

export type Env = z.infer<typeof Env>

dotenv.config()

if (process.env.NODE_ENV !== 'test') {
  Env.parse(process.env)
}

export const env = process.env as unknown as Env
