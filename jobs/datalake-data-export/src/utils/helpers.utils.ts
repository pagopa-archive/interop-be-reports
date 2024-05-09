import { randomUUID } from 'crypto'
import { ExportedCollection } from '../models.js'
import { format } from 'date-fns'
import { logError, logInfo, logWarn } from '@interop-be-reports/commons'

/**
 * Get the path where to store the ndjson file
 * - data / ...
 *   - [collection] /
 *      - yyyyMMdd /
 *        - yyyyMMdd_HHmmss_[random_uuid].njson
 *        - yyyyMMdd_HHmmss_[random_uuid].njson
 *        - yyyyMMdd_HHmmss_[random_uuid].njson
 * - count / ...
 */
export function getNdjsonBucketKey(collection: ExportedCollection, date: Date): string {
  return format(date, `'data/${collection}/'yyyyMMdd'/'yyyyMMdd'_'HHmmss'_${randomUUID()}.ndjson'`)
}

/**
 * Get the path where to store the count file
 * - data / ...
 * - count /
 *   - [collection] /
 *      - yyyyMMdd /
 *        - yyyyMMdd_HHmmss.json
 *        - yyyyMMdd_HHmmss.json
 *        - yyyyMMdd_HHmmss.json
 */
export function getDataCountBucketKey(collection: ExportedCollection, date: Date): string {
  return format(date, `'count/${collection}/'yyyyMMdd'/'yyyyMMdd'_'HHmmss'.json'`)
}

/**
 * Split an array into chunks of a specific size
 */
export function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Convert an array to a ndjson string
 */
export function arrayToNdjson(array: unknown[]): string {
  return array.map((item) => JSON.stringify(item)).join('\n') + '\n'
}

const cidJob = randomUUID()

export const log = {
  info: logInfo.bind(null, cidJob),
  warn: logWarn.bind(null, cidJob),
  error: logError.bind(null, cidJob),
}
