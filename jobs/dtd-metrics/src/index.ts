import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import {
  getPublishedEServicesMetric,
  getEServicesByMacroCategoriesMetric,
  getMostSubscribedEServicesMetric,
  getTopProducersBySubscribersMetric,
  getTopProducersMetric,
  getOnboardedTenantsCountMetric,
  getTenantDistributionMetric,
  getMacroCategoriesOnboardingTrendMetric,
  getTenantOnboardingTrendMetric,
  getTotalTokensMetric,
  getTokensTrendMetric,
  getMostUsedEServicesMetric,
  getEServicesWithMostTokensMetric,
  getTotalConnectionsMetric,
} from './metrics/index.js'
import {
  GithubClient,
  GlobalStoreService,
  MetricsProducerService,
  MetricsOutputFormatterService,
  MetricsOpenDataRdfGenerator,
} from './services/index.js'
import { log } from './utils/helpers.utils.js'
import { writeFileSync } from 'fs'

log.info('Starting program...')

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

try {
  const githubClient = new GithubClient(env.GITHUB_ACCESS_TOKEN)
  const awsS3BucketClient = new AwsS3BucketClient(env.STORAGE_BUCKET, env.AWS_REGION)

  log.info('Initializing global store...')
  const globalStore = await GlobalStoreService.init(readModel, { cache: env.CACHE_GLOBAL_STORE })
  log.info('Global store initialized!')

  log.info('Producing metrics...')

  const metrics = await new MetricsProducerService(readModel, globalStore)
    .addMetric('totaleEnti', getOnboardedTenantsCountMetric)
    .addMetric('andamentoDelleAdesioni', getTenantOnboardingTrendMetric)
    .addMetric('andamentoDelleAdesioniPerCategoria', getMacroCategoriesOnboardingTrendMetric)
    .addMetric('distribuzioneDegliEntiPerAttivita', getTenantDistributionMetric)
    .addMetric('eservicePubblicati', getPublishedEServicesMetric)
    .addMetric('distribuzioneEServicePerEntiErogatori', getEServicesByMacroCategoriesMetric)
    .addMetric('entiChePubblicanoPiuEService', getTopProducersMetric)
    .addMetric('entiConPiuConnessioniAbilitate', getTopProducersBySubscribersMetric)
    .addMetric('eServiceConPiuEntiAbilitati', getMostSubscribedEServicesMetric)
    .addMetric('totaleRichiesteDiAccesso', getTotalTokensMetric)
    .addMetric('attivitaDellaPiattaforma', getTokensTrendMetric)
    .addMetric('eServicePiuUtilizzati', getMostUsedEServicesMetric)
    .addMetric('eserviceConPiuTokenStaccati', getEServicesWithMostTokensMetric)
    .addMetric('connessioniTotali', getTotalConnectionsMetric)
    .produceMetrics({
      filter: env.METRICS_FILTER,
    })

  log.info(`Uploading files...`)

  const metricsOutputFormatter = new MetricsOutputFormatterService(metrics)

  const dashboardOuput = { ...metricsOutputFormatter.getMetricsDashboardData(), dataDiPubblicazione: new Date() }
  if (env.PRODUCE_OUTPUT_JSON) {
    writeFileSync('dtd-metrics.json', JSON.stringify(dashboardOuput, null, 2))
  }

  const dtdFilesOutput = metricsOutputFormatter.getDtdMetricsFiles()
  for (const { filename, data } of dtdFilesOutput) {
    await githubClient.createOrUpdateRepoFile(data, env.GITHUB_REPO_OWNER, env.GITHUB_REPO, `data/${filename}`)
  }

  await awsS3BucketClient.uploadData(dashboardOuput, env.FILENAME)

  log.info('Generating and uploading rdf opendata file...')
  const rdfFileOutput = new MetricsOpenDataRdfGenerator().produceOpenDataRDF()
  await githubClient.createOrUpdateRepoFile(
    rdfFileOutput,
    env.GITHUB_REPO_OWNER,
    env.GITHUB_REPO,
    `metadata/pdnd-opendata.rdf`
  )

  log.info('Done!')
} finally {
  await readModel.close()
}
