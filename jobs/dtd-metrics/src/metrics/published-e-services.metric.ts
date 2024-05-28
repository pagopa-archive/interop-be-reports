import { EServiceDescriptor } from '@interop-be-reports/commons'
import { PublishedEServicesMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { Document } from 'mongodb'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3744
 **/
export const getPublishedEServicesMetric: MetricFactoryFn<'eservicePubblicati'> = async (readModel, globalStore) => {
  const oneMonthAgoDate = getMonthsAgoDate(1)

  const publishedEServiceFilter: Document = {
    // Only count e-services that belong to tenants that are in the global store,
    // The global store filters out AOO/UO tenants
    'data.producerId': {
      $in: Array.from(globalStore.tenantsMap.keys()),
    },
    'data.descriptors.state': {
      $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
    },
  }

  const publishedEServicesCountPromise = readModel.eservices.countDocuments(publishedEServiceFilter)

  const lastMonthPublishedEServicesCountPromise = readModel.eservices.countDocuments({
    ...publishedEServiceFilter,
    'data.descriptors': {
      $elemMatch: {
        version: '1',
        publishedAt: {
          $gte: oneMonthAgoDate.toISOString(),
        },
      },
    },
  })

  const [count, lastMonthCount] = await Promise.all([
    publishedEServicesCountPromise,
    lastMonthPublishedEServicesCountPromise,
  ])

  const variation = getVariationPercentage(lastMonthCount, count)

  return PublishedEServicesMetric.parse({ count, lastMonthCount, variation })
}
