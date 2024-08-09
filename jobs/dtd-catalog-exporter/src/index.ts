import { MongoDBEServiceClient } from './services/index.js'
import {
  getAllAttributesIdsInEServicesActiveDescriptors,
  getAllTenantsIdsInEServices,
  remapEServiceToPublicEService,
  getSafeMapFromIdentifiableRecords,
} from './utils/index.js'
import { PublicEServices } from './models/index.js'
import { withExecutionTime, AwsS3BucketClient } from '@interop-be-reports/commons'
import { env } from './configs/env.js'

const log = console.log

async function main(): Promise<void> {
  const dtdCatalogBucketClient = new AwsS3BucketClient(env.DTD_CATALOG_STORAGE_BUCKET, env.AWS_REGION)
  log('Connecting to database...')
  const mongoDBEServiceClient = await MongoDBEServiceClient.connect()
  log('Connected to database!\n')

  log('Fetching e-services from database...')
  const eservices = await mongoDBEServiceClient.getEServices()

  log("Fetching e-service's tenants and attributes data from database...")
  const eserviceAttributeIds = getAllAttributesIdsInEServicesActiveDescriptors(eservices)
  const tenantIds = getAllTenantsIdsInEServices(eservices)

  const attributes = await mongoDBEServiceClient.getEServicesAttributes(eserviceAttributeIds)
  const tenants = await mongoDBEServiceClient.getEServicesTenants(tenantIds)

  log('Data successfully fetched!\n')

  log('Remapping e-services to public e-services...\n')
  const attributesMap = getSafeMapFromIdentifiableRecords(attributes)
  const tenantsMap = getSafeMapFromIdentifiableRecords(tenants)
  const publicEServices = eservices.map((eservice) => {
    log(`Remapping ${eservice.name} - ${eservice.id} ...`)
    return remapEServiceToPublicEService(eservice, attributesMap, tenantsMap)
  })

  log('\nRemapping completed! Validating result...')
  PublicEServices.parse(publicEServices)

  log('\nUploading result to S3 bucket...')
  await dtdCatalogBucketClient.uploadData(
    publicEServices,
    `${env.DTD_CATALOG_STORAGE_PATH}/${env.FILENAME}`
  )

  await mongoDBEServiceClient.close()
  log('\nDone!')
}

withExecutionTime(main)
