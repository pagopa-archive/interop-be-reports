import dotenv from 'dotenv'
import { z } from 'zod'

export const Env = z.object({
  AWS_REGION: z.string(),
  
  ESERVICES_COLLECTION_NAME: z.string(),
  ATTRIBUTES_COLLECTION_NAME: z.string(),
  TENANTS_COLLECTION_NAME: z.string(),

  READ_MODEL_DB_USER: z.string(),
  READ_MODEL_DB_PASSWORD: z.string(),
  READ_MODEL_DB_HOST: z.string(),
  READ_MODEL_DB_PORT: z.string(),
  READ_MODEL_DB_NAME: z.string(),

  DTD_CATALOG_STORAGE_BUCKET: z.string(),
  DTD_CATALOG_STORAGE_PATH: z.string(),
  FILENAME: z.string(),
})

export type Env = z.infer<typeof Env>

dotenv.config()

// Skip env runtime check if we are in test environment
if (process.env.NODE_ENV !== 'test') {
  Env.parse(process.env)
}

export const env = process.env as Env
