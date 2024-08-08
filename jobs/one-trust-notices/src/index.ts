import { OneTrustClient, html2json } from './services/index.js'
import { env, ONE_TRUST_NOTICES } from './config/index.js'
import { OneTrustNoticeDBSchema } from './models/index.js'
import {
  getNoticeContent,
  remapOneTrustNoticeVersionToDynamoDBSchemaUpdateObject,
  resolveError,
  getVersionedNoticeBucketPath,
  getLatestNoticeBucketPath,
} from './utils/index.js'
import {
  AwsS3BucketClient,
  DynamoDbTableClient,
  withExecutionTime,
} from '@interop-be-reports/commons'

const log = console.log

async function main(): Promise<void> {
  const historyBucketClient = new AwsS3BucketClient(env.HISTORY_STORAGE_BUCKET)
  const contentBucketClient = new AwsS3BucketClient(env.CONTENT_STORAGE_BUCKET)
  const dynamoDbTableClient = new DynamoDbTableClient<OneTrustNoticeDBSchema>(
    env.PRIVACY_NOTICES_DYNAMO_TABLE_NAME,
    env.AWS_REGION
  )

  log('Program started.\n')
  log('> Connecting to OneTrust...')
  const oneTrustClient = await OneTrustClient.connect()

  log('Connected!\n')

  for (const oneTrustNotice of ONE_TRUST_NOTICES) {
    try {
      log(`> Getting ${oneTrustNotice.name} data...`)

      const [noticeActiveVersion, ...localizedNoticeContentResponses] = await Promise.all([
        // Get the active version of the notice...
        oneTrustClient.getNoticeActiveVersion(oneTrustNotice.id),
        // ... and the localized content for each language.
        ...env.LANGS.map((lang) => {
          return oneTrustClient.getNoticeContent(oneTrustNotice.id, lang)
        }),
      ])

      // Extracts the notice content for each language.
      const localizedNoticeContents = localizedNoticeContentResponses.map(getNoticeContent)

      // Generate the bucket paths for each language.
      const versionedContentBucketPaths = localizedNoticeContents.map((noticeContent, index) =>
        getVersionedNoticeBucketPath(env.LANGS[index], noticeContent)
      )
      const latestContentBucketPaths = env.LANGS.map((lang) =>
        getLatestNoticeBucketPath(lang, oneTrustNotice.type)
      )

      log('> Checking if it is a new version...')

      // We check if there is a new version by checking if the history bucket already has one of the versioned paths.
      const versionedBucketContentList = await historyBucketClient.getBucketContentList()
      const isNewVersion = !versionedContentBucketPaths.some((bucketPath) =>
        versionedBucketContentList.includes(bucketPath)
      )

      if (isNewVersion) {
        log(`\nNew version found!`)
        log(`> Uploading to ${env.HISTORY_STORAGE_BUCKET} bucket...\n`)
        await Promise.all(
          localizedNoticeContentResponses.map((noticeContentResponse, index) =>
            historyBucketClient.uploadData(
              noticeContentResponse,
              versionedContentBucketPaths[index]
            )
          )
        )
      } else {
        log('\nNo new version found.\n')
      }

      log(`> Uploading notice content to ${env.CONTENT_STORAGE_BUCKET} bucket...`)

      const jsonHtmlNodes = localizedNoticeContents.map(({ content }) => html2json(content))

      await Promise.all([
        ...jsonHtmlNodes.map((jsonHtmlNode, index) =>
          contentBucketClient.uploadData(jsonHtmlNode, versionedContentBucketPaths[index])
        ),
        ...jsonHtmlNodes.map((jsonHtmlNode, index) =>
          contentBucketClient.uploadData(jsonHtmlNode, latestContentBucketPaths[index])
        ),
      ])

      log(`> Updating ${oneTrustNotice.name} data in DynamoDB...`)

      await dynamoDbTableClient.updateItem(
        { privacyNoticeId: oneTrustNotice.id },
        remapOneTrustNoticeVersionToDynamoDBSchemaUpdateObject(noticeActiveVersion)
      )

      log(`Finished ${oneTrustNotice.name}!\n`)
    } catch (error) {
      log(`Error while processing ${oneTrustNotice.name}:`)
      log(resolveError(error))
      log(`Skipping ${oneTrustNotice.name}...\n`)
    }
  }

  log('Done!.')
}

withExecutionTime(main)
