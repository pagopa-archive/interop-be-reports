import dotenv from 'dotenv'
import { z } from 'zod'

export const Env = z.object({
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

  SMTP_ADDRESS: z.string(),
  SMTP_PORT: z.string().transform((value) => Number(value)),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_SECURE: z.string().transform((value) => value === 'true'),
  MAIL_RECIPIENTS: z.string().transform((value) => value.split(',')),
  REPORT_SENDER_MAIL: z.string().email(),
  REPORT_SENDER_LABEL: z.string(),

  ATHENA_TOKENS_DB_NAME: z.string(),
  ATHENA_OUTPUT_BUCKET: z.string(),

  ENVIRONMENT: z.string(),

  // If set, a xmls file with output will be saved locally
  PRODUCE_OUTPUT: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
})

export type Env = z.infer<typeof Env>

dotenv.config()

export const env = Env.parse(process.env)
