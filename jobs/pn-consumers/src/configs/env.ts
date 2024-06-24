import dotenv from 'dotenv'
import { z } from 'zod'

export const Env = z.object({
  READ_MODEL_DB_USER: z.string(),
  READ_MODEL_DB_PASSWORD: z.string(),
  READ_MODEL_DB_HOST: z.string(),
  READ_MODEL_DB_PORT: z.string(),
  READ_MODEL_DB_NAME: z.string(),

  SMTP_ADDRESS: z.string(),
  SMTP_PORT: z.string().transform((value) => Number(value)),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_SECURE: z.string().transform((value) => value === 'true'),
  MAIL_RECIPIENTS: z.string().transform((value) => value.split(',')),
  REPORT_SENDER: z.string().email(),

  PN_ESERVICE_ID: z.string(),
  COMUNI_E_LORO_CONSORZI_E_ASSOCIAZIONI_ATTRIBUTE_ID: z.string(),

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
})

export type Env = z.infer<typeof Env>

dotenv.config()

export const env: Env = Env.parse(process.env)
