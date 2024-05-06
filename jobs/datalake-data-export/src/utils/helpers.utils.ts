import { randomUUID } from 'crypto'
import { ExportedCollection } from '../models.js'
import { format } from 'date-fns'
import { logError, logInfo, logWarn } from '@interop-be-reports/commons'

/**
 * Get the path where to store the ndjson file
 */
export function getNdjsonBucketKey(collection: ExportedCollection, date: Date): string {
  return format(date, `'${collection}/'yyyyMMdd'/'yyyyMMdd'_'HHmmss'_${randomUUID()}.ndjson'`)
}

/**
 * Get the path where to store the count file
 */
export function getDataCountBucketKey(collection: ExportedCollection, date: Date): string {
  return format(date, `'${collection}/'yyyyMMdd'/'yyyyMMdd'_'HHmmss'_${randomUUID()}_count.json'`)
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
