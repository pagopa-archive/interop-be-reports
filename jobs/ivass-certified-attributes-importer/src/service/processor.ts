import { IVASS_INSURANCES_ATTRIBUTE_CODE } from '../config/constants.js'
import { parse } from 'csv/sync'
import {
  PersistentTenantFeatureCertifier,
  RefreshableInteropToken,
  logError,
  logInfo,
} from '@interop-be-reports/commons'
import crypto from 'crypto'
import { AttributeIdentifiers, BatchParseResult, IvassAttributes } from '../model/processor.model.js'
import { TenantProcessService } from './tenant-process.service.js'
import { PersistentTenant } from '../model/tenant.model.js'
import { CsvRow, RawCsvRow } from '../model/csv-row.model.js'
import { InteropContext } from '../model/interop-context.model.js'
import { ReadModelQueries } from './read-model-queries.service.js'

export async function importAttributes(
  csvDownloader: () => Promise<string>,
  readModel: ReadModelQueries,
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  recordsBatchSize: number,
  ivassTenantId: string
): Promise<void> {
  const jobCorrelationId = crypto.randomUUID()

  logInfo(jobCorrelationId, 'IVASS Certified attributes importer started')

  const fileContent = await csvDownloader()

  const attributes: IvassAttributes = await getAttributesIdentifiers(readModel, ivassTenantId)

  const allOrgsInFile = await assignAttributes(
    readModel,
    tenantProcess,
    refreshableToken,
    attributes,
    fileContent,
    recordsBatchSize,
    jobCorrelationId
  )

  await unassignAttributes(readModel, tenantProcess, refreshableToken, allOrgsInFile, attributes, jobCorrelationId)

  logInfo(jobCorrelationId, 'IVASS Certified attributes importer completed')
}

async function assignAttributes(
  readModel: ReadModelQueries,
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  attributes: IvassAttributes,
  fileContent: string,
  batchSize: number,
  jobCorrelationId: string
): Promise<string[]> {
  let scanComplete = false
  let fromLine = 1
  let allOrgsInFile: string[] = []

  const now = Date.now()

  logInfo(jobCorrelationId, 'Assigning attributes...')

  do {
    const batchResult: BatchParseResult = getBatch(fileContent, fromLine, batchSize, jobCorrelationId)

    const assignments = batchResult.records.filter((record) => isAttributeAssigned(record, now))

    if (assignments.length > 0) {
      const externalId = assignments.map((org) => org.CODICE_FISCALE || org.CODICE_IVASS)

      const tenants = await readModel.getIVASSTenants(externalId)

      await Promise.all(
        tenants.map(async (tenant) => {
          await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.ivassInsurances, jobCorrelationId)
        })
      )

      allOrgsInFile = allOrgsInFile.concat(assignments.map((a) => a.CODICE_FISCALE || a.CODICE_IVASS))
    }

    fromLine = fromLine + batchSize
    scanComplete = batchResult.processedRecordsCount === 0
  } while (!scanComplete)

  logInfo(jobCorrelationId, 'Attributes assignment completed')

  if (allOrgsInFile.length === 0) {
    throw new Error('File does not contain valid assignments')
  }

  return allOrgsInFile
}

async function unassignAttributes(
  readModel: ReadModelQueries,
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  allOrgsInFile: string[],
  attributes: IvassAttributes,
  jobCorrelationId: string
): Promise<void> {
  logInfo(jobCorrelationId, 'Revoking attributes...')

  const tenantsWithAttribute = await readModel.getTenantsWithAttributes([attributes.ivassInsurances.id])
  await Promise.all(
    tenantsWithAttribute
      .filter((tenant) => !allOrgsInFile.includes(tenant.externalId.value))
      .map(async (tenant) => {
        await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.ivassInsurances, jobCorrelationId)
      })
  )

  logInfo(jobCorrelationId, 'Attributes revocation completed')
}

async function getAttributesIdentifiers(readModel: ReadModelQueries, ivassTenantId: string): Promise<IvassAttributes> {
  const ivassTenant: PersistentTenant = await readModel.getTenantById(ivassTenantId)
  const certifier = ivassTenant.features.find((f) => f.type === 'PersistentCertifier')

  if (!certifier) {
    throw Error(`Tenant with id ${ivassTenantId} is not a certifier`)
  }

  const ivassInsurances = await readModel.getAttributeByExternalId(
    (certifier as PersistentTenantFeatureCertifier).certifierId,
    IVASS_INSURANCES_ATTRIBUTE_CODE
  )

  return {
    ivassInsurances: {
      id: ivassInsurances.id,
      externalId: { origin: ivassInsurances.origin, value: ivassInsurances.code },
    },
  }
}

const isAttributeAssigned = (org: CsvRow, now: number): boolean => {
  return org.DATA_ISCRIZIONE_ALBO_ELENCO.getTime() < now && org.DATA_CANCELLAZIONE_ALBO_ELENCO.getTime() > now
}

async function assignAttribute(
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  tenant: PersistentTenant,
  attribute: AttributeIdentifiers,
  jobCorrelationId: string
): Promise<void> {
  if (!tenantContainsAttribute(tenant, attribute.id)) {
    logInfo(jobCorrelationId, `Assigning attribute ${attribute.id} to tenant ${tenant.id}`)

    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized,
    }
    await tenantProcess.internalAssignCertifiedAttribute(
      tenant.externalId.origin,
      tenant.externalId.value,
      attribute.externalId.origin,
      attribute.externalId.value,
      context
    )
  }
}

async function unassignAttribute(
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  tenant: PersistentTenant,
  attribute: AttributeIdentifiers,
  jobCorrelationId: string
): Promise<void> {
  if (tenantContainsAttribute(tenant, attribute.id)) {
    logInfo(jobCorrelationId, `Revoking attribute ${attribute.id} to tenant ${tenant.id}`)

    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized,
    }
    await tenantProcess.internalRevokeCertifiedAttribute(
      tenant.externalId.origin,
      tenant.externalId.value,
      attribute.externalId.origin,
      attribute.externalId.value,
      context
    )
  }
}

function tenantContainsAttribute(tenant: PersistentTenant, attributeId: string): boolean {
  return tenant.attributes.find((attribute) => attribute.id === attributeId) !== undefined
}

function getBatch(
  fileContent: string,
  fromLine: number,
  batchSize: number,
  jobCorrelationId: string
): BatchParseResult {
  const rawRecords = parse(fileContent.trim(), {
    ltrim: true,
    columns: true,
    relax_quotes: true,
    from: fromLine,
    to: fromLine + batchSize - 1,
    delimiter: ';',
  }) as Array<object>

  const records: CsvRow[] = rawRecords
    .map((value, index) => {
      const result = RawCsvRow.safeParse(value)
      if (result.success) return result.data
      else {
        logError(jobCorrelationId, `Error parsing row ${fromLine + index}. Row: ${JSON.stringify(value)}`, result.error)
        return null
      }
    })
    .map((r) => {
      if (!r) return null
      else {
        const row: CsvRow = {
          CODICE_IVASS: r.CODICE_IVASS,
          DATA_ISCRIZIONE_ALBO_ELENCO: r.DATA_ISCRIZIONE_ALBO_ELENCO,
          DATA_CANCELLAZIONE_ALBO_ELENCO: r.DATA_CANCELLAZIONE_ALBO_ELENCO,
          CODICE_FISCALE: r.CODICE_FISCALE,
        }

        return row
      }
    })
    .filter((r): r is CsvRow => r !== null)

  return {
    processedRecordsCount: rawRecords.length,
    records,
  }
}
