import { z } from 'zod'
import dotenv from 'dotenv'

const Env = z.object({
  AWS_REGION: z.string(),
  
  LANGS: z.string().transform((value) => value.split(',')),

  CONTENT_STORAGE_BUCKET: z.string(),
  HISTORY_STORAGE_BUCKET: z.string(),

  ONETRUST_CLIENT_ID: z.string(),
  ONETRUST_CLIENT_SECRET: z.string(),

  PRIVACY_NOTICES_UPDATER_TERMS_OF_SERVICE_UUID: z.string(),
  PRIVACY_NOTICES_UPDATER_PRIVACY_POLICY_UUID: z.string(),
  PRIVACY_NOTICES_DYNAMO_TABLE_NAME: z.string(),
})

type Env = z.infer<typeof Env>

dotenv.config()
export const env: Env = Env.parse(process.env)
