import { AwsS3BucketClient, ReadModelClient, SafeMap, getActiveDescriptor } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import { ReadPreferenceMode } from 'mongodb'
import { getAttributes, getEServices, getTotalLoadEServices } from './services/read-model-queries.service.js'
import {
  getAllAttributesIdsInEServicesActiveDescriptors,
  remapDescriptorAttributesToEServiceResultAttributes,
} from './utils/helpers.utils.js'
import { EServiceResult } from './models/eservice-result.model.js'

const log = console.log

log('Process started')

log('Connecting to read model')
const readModelClient = await ReadModelClient.connect({
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

const awsS3BucketClient = new AwsS3BucketClient(env.STORAGE_BUCKET, env.AWS_REGION)

log('Getting e-service data...')
const eservices = await getEServices(readModelClient)

log('Getting e-service load data...')
const eserviceIds = eservices.map((eservice) => eservice.id)
const purposes = await getTotalLoadEServices(readModelClient, eserviceIds)

log('Getting attributes data...')
const attributesIds = getAllAttributesIdsInEServicesActiveDescriptors(eservices)
const attributes = await getAttributes(readModelClient, attributesIds)

// Map purposes to a map of eserviceId -> actualLoad
const actualLoadMap = new Map(purposes.map((purpose) => [purpose.eserviceId, purpose.actualLoad]))
// Map attributes to a map of attributeId -> attribute
const attributesMap = new SafeMap(attributes.map((attribute) => [attribute.id, attribute]))

// Enrich e-services with actual load and remapped attributes and sort them by actual load
const result: Array<EServiceResult> = eservices
  .map((eservice) => {
    const activeDescriptor = getActiveDescriptor(eservice.descriptors)

    if (!activeDescriptor) {
      throw new Error(`EService ${eservice.name} - ${eservice.id} has no active descriptor`)
    }

    return EServiceResult.parse({
      ...eservice,
      attributes: remapDescriptorAttributesToEServiceResultAttributes(activeDescriptor.attributes, attributesMap),
      activeDescriptor: {
        id: activeDescriptor.id,
        state: activeDescriptor.state,
        version: activeDescriptor.version,
      },
      dailyCallsTotal: activeDescriptor.dailyCallsTotal,
      dailyCallsPerConsumer: activeDescriptor.dailyCallsPerConsumer,
      voucherLifespan: activeDescriptor.voucherLifespan,
      actualLoad: actualLoadMap.get(eservice.id) ?? 0, // If no purpose is found, set actual load to 0
    })
  })
  .sort((a, b) => b.actualLoad - a.actualLoad)

log(`Uploading data to ${env.STORAGE_BUCKET}...`)

await awsS3BucketClient.uploadData(result, env.FILENAME)

log('Done.')
