import { Mailer } from '@interop-be-reports/commons'
import { ExcelGenerator, ReadModelQueriesService } from './services/index.js'
import { env } from './configs/env.js'
import {
  generateAgreementsWorksheetTableData,
  generateDescriptorsWorksheetTableData,
  generateTokensWorksheetTableData,
  log,
} from './utils/helpers.util.js'
import { writeFileSync } from 'fs'
import { TokensQueriesService } from './services/athena-queries.service.js'

const EMAIL_SUBJECT = `Report ${env.ENVIRONMENT}`
const EMAIL_TEXT = `Data report of ${env.ENVIRONMENT}`
const REPORT_FILE_NAME = `report-${env.ENVIRONMENT}.xlsx`

log.info('Job started')

const readModelQueries = await ReadModelQueriesService.connect()

log.info('Fetching data from read model...')

log.info('Fetching e-services...')
const eservices = await readModelQueries.getAllEServices()

log.info('Fetching agreements...')
const agreements = await readModelQueries.getAllAgreements()

log.info('Fetching purposes...')
const purposes = await readModelQueries.getAllPurposes()

log.info('Fetching tenants...')
const tenants = await readModelQueries.getAllOnboardedTenants()

await readModelQueries.close()

log.info('Fetching tokens data...')
const tokenQueries = new TokensQueriesService()
const tokens = await tokenQueries.getTokensData()

log.info('Generating excel file...')

const eservicesMap = new Map(eservices.map((eservice) => [eservice.id, eservice]))
const agreementsMap = new Map(agreements.map((agreement) => [agreement.id, agreement]))
const tenantsMap = new Map(tenants.map((tenant) => [tenant.id, tenant]))

const excel = await new ExcelGenerator()
  .addWorksheetTable({
    name: 'Agreements',
    data: generateAgreementsWorksheetTableData(agreements, purposes, eservicesMap, tenantsMap),
  })
  .addWorksheetTable({
    name: 'Descriptors',
    data: generateDescriptorsWorksheetTableData(eservices, tenantsMap),
  })
  .addWorksheetTable({
    name: 'Tokens',
    data: generateTokensWorksheetTableData(tokens, agreementsMap),
  })
  .generateExcelFile()

if (env.PRODUCE_OUTPUT) {
  log.info('Writing excel file...')
  writeFileSync(REPORT_FILE_NAME, excel)
}

log.info('Sending email...')

const mailer = new Mailer({
  name: env.SMTP_ADDRESS,
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
  subject: EMAIL_SUBJECT,
  text: EMAIL_TEXT,
  attachments: [{ filename: REPORT_FILE_NAME, content: excel }],
})

log.info('Job finished!')
