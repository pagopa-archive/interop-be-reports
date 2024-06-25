import { ReadModelQueriesClient } from './services/index.js'
import { toCsvDataRow } from './utils/index.js'
import { CSV_FILENAME, MAIL_BODY, MAIL_SUBJECT, env } from './configs/index.js'
import { Mailer, ReadModelClient, toCSV, withExecutionTime } from '@interop-be-reports/commons'

const log = console.log

async function main(): Promise<void> {
  log('Program started.\n')

  log('> Connecting to database...')
  const readModel = await ReadModelClient.connect({
    mongodbReplicaSet: env.MONGODB_REPLICA_SET,
    mongodbDirectConnection: env.MONGODB_DIRECT_CONNECTION,
    mongodbReadPreference: env.MONGODB_READ_PREFERENCE,
    mongodbRetryWrites: env.MONGODB_RETRY_WRITES,
    readModelDbUser: env.READ_MODEL_DB_USER,
    readModelDbPassword: env.READ_MODEL_DB_PASSWORD,
    readModelDbHost: env.READ_MODEL_DB_HOST,
    readModelDbPort: env.READ_MODEL_DB_PORT,
    readModelDbName: env.READ_MODEL_DB_NAME,
  })

  const readModelsQueriesClient = new ReadModelQueriesClient(readModel)
  log('> Connected to database!\n')

  log('> Getting data...')

  const purposes = await readModelsQueriesClient.getSENDPurposes(
    env.PN_ESERVICE_ID,
    env.COMUNI_E_LORO_CONSORZI_E_ASSOCIAZIONI_ATTRIBUTE_ID
  )

  if (purposes.length === 0) {
    log('> No purposes data found. Exiting program.')
    process.exit(0)
  }

  const csv = toCSV(purposes.map(toCsvDataRow))

  log('> Data csv produced!\n')

  log('> Sending emails...')

  const mailer = new Mailer({
    host: env.SMTP_ADDRESS,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  })

  await mailer.sendMail({
    from: env.REPORT_SENDER,
    to: env.MAIL_RECIPIENTS,
    subject: MAIL_SUBJECT,
    text: MAIL_BODY,
    attachments: [{ filename: CSV_FILENAME, content: csv }],
  })

  log('> Success!\n')
  log('End of program.')

  await readModelsQueriesClient.close()
  process.exit(0)
}

withExecutionTime(main)
