import { EServiceDescriptor } from '@interop-be-reports/commons'
import { EServicesByMacroCategoriesMetric } from '../models/metrics.model.js'
import { MacroCategory } from '../models/macro-categories.model.js'
import { z } from 'zod'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3745
 */
export const getEServicesByMacroCategoriesMetric: MetricFactoryFn<'distribuzioneEServicePerEntiErogatori'> = async (
  readModel,
  globalStore
) => {
  const eservices = await readModel.eservices
    .aggregate([
      {
        $match: {
          'data.descriptors.state': {
            $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
          },
        },
      },
      {
        $project: {
          _id: 0,
          'data.producerId': 1,
        },
      },
    ])
    .map(({ data }) => z.object({ producerId: z.string() }).parse(data))
    .toArray()

  const getMacroCategoryPublishedEServicesCount = (macroCategory: MacroCategory): number =>
    eservices.reduce((count, eservice) => {
      if (macroCategory.tenantsIds.includes(eservice.producerId)) return count + 1
      else return count
    }, 0)

  const result = globalStore.macroCategories.map((macroCategory) => ({
    id: macroCategory.id,
    name: macroCategory.name,
    count: getMacroCategoryPublishedEServicesCount(macroCategory),
  }))

  return EServicesByMacroCategoriesMetric.parse(result)
}
