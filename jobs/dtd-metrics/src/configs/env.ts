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

  STORAGE_BUCKET: z.string(),
  GITHUB_REPO: z.string(),
  GITHUB_REPO_OWNER: z.string(),
  GITHUB_ACCESS_TOKEN: z.string(),
  FILENAME: z.string(),

  ATHENA_TOKENS_TABLE_NAME: z.string(),
  ATHENA_OUTPUT_BUCKET: z.string(),

  // If set, only metrics with names matching this string will be produced
  METRICS_FILTER: z.string().optional(),
  // If set, a JSON file with the metrics output will be produced
  PRODUCE_OUTPUT_JSON: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  // If set, the data that needs to fetch the global store will be cached, used to speed up development
  CACHE_GLOBAL_STORE: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
})

export type Env = z.infer<typeof Env>

dotenv.config()

if (process.env.NODE_ENV !== 'test') {
  Env.parse(process.env)
}

export const env = process.env as unknown as Env
