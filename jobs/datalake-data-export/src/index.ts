import { AwsS3BucketClient, ReadModelClient } from '@interop-be-reports/commons'
import { ReadPreferenceMode } from 'mongodb'
import { env } from './configs/env.js'
import { ReadModelQueriesService } from './services/read-model-queries.service.js'
import {
  arrayToNdjson,
  getDataCountBucketKey,
  getNdjsonBucketKey,
  log,
  splitArrayIntoChunks,
} from './utils/helpers.utils.js'
import { ExportedAgreement, ExportedCollection, ExportedEService, ExportedPurpose, ExportedTenant } from './models.js'

const exportTimestamp = new Date()

log.info('Program started')

log.info('Connecting to read model...')
const readModel = await ReadModelClient.connect({
  mongodbReplicaSet: env.MONGODB_REPLICA_SET,
  mongodbDirectConnection: env.MONGODB_DIRECT_CONNECTION,
  mongodbReadPreference: env.MONGODB_READ_PREFERENCE as ReadPreferenceMode,
  mongodbRetryWrites: env.MONGODB_RETRY_WRITES,
  readModelDbHost: env.READ_MODEL_DB_HOST,
  readModelDbPort: env.READ_MODEL_DB_PORT,
  readModelDbUser: env.READ_MODEL_DB_USER,
  readModelDbPassword: env.READ_MODEL_DB_PASSWORD,
  readModelDbName: env.READ_MODEL_DB_NAME,
})

const readModelQueries = new ReadModelQueriesService(readModel)

log.info('Fetching data from read model...')

const tenants = await readModelQueries.getTenants()
const eservices = await readModelQueries.getEServices()
const agreements = await readModelQueries.getAgreements()
const purposes = await readModelQueries.getPurposes()

await readModel.close()

log.info('Preparing data for export...')

function generateNdjsonFiles(
  data: (ExportedAgreement | ExportedEService | ExportedPurpose | ExportedTenant)[]
): string[] {
  const dataWithTimestamp = data.map((item) => ({ ...item, exportTimestamp }))
  const dataChunks = splitArrayIntoChunks(dataWithTimestamp, 1000)

  return dataChunks.map(arrayToNdjson)
}

const dataToExport: [collection: ExportedCollection, ndjsonFiles: string[], count: number][] = [
  ['tenants', generateNdjsonFiles(tenants), tenants.length],
  ['eservices', generateNdjsonFiles(eservices), eservices.length],
  ['agreements', generateNdjsonFiles(agreements), agreements.length],
  ['purposes', generateNdjsonFiles(purposes), purposes.length],
]

log.info(`Uploading data to ${env.DATALAKE_STORAGE_BUCKET} bucket...`)

const s3Bucket = new AwsS3BucketClient(env.DATALAKE_STORAGE_BUCKET)
for (const [collection, ndjsonFiles, count] of dataToExport) {
  const countBucketKey = getDataCountBucketKey(collection, exportTimestamp)
  await s3Bucket.uploadData({ count, exportTimestamp }, countBucketKey)
  for (const ndjson of ndjsonFiles) {
    const bucketKey = getNdjsonBucketKey(collection, exportTimestamp)
    await s3Bucket.uploadData(ndjson, bucketKey)
  }
}

log.info('Done!')
