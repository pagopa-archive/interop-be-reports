import { getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getPublishedEServicesMetric } from '../published-e-services.metric.js'
import { randomUUID } from 'crypto'

const producerUUID = randomUUID()
const comuniAttributeUUID = randomUUID()

describe('getPublishedEServicesMetric', () => {
  it('should return the correct metrics', async () => {
    const today = new Date()
    const moreThanOneMonthAgo = new Date(today)

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: producerUUID,
          attributes: [{ id: comuniAttributeUUID }],
          onboardedAt: new Date().toISOString(),
        }),
      },
    ])

    await seedCollection('attributes', [
      { data: { id: comuniAttributeUUID, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> } },
    ])

    moreThanOneMonthAgo.setDate(moreThanOneMonthAgo.getDate() - 40)

    await seedCollection('eservices', [
      {
        data: getEServiceMock({
          producerId: producerUUID,
          descriptors: [{ version: '1', state: 'Published', publishedAt: today.toISOString() }],
        }),
      },
      {
        data: getEServiceMock({
          producerId: producerUUID,
          descriptors: [
            { version: '1', state: 'Suspended', publishedAt: today.toISOString() },
            { version: '2', state: 'Draft' },
          ],
        }),
      },
      {
        data: getEServiceMock({
          producerId: producerUUID,
          descriptors: [
            { version: '1', state: 'Suspended', publishedAt: moreThanOneMonthAgo.toISOString() },
            { version: '2', state: 'Deprecated' },
          ],
        }),
      },
      { data: getEServiceMock({ producerId: producerUUID, descriptors: [{ state: 'Draft' }] }) },
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getPublishedEServicesMetric(readModelMock, globalStore)
    expect(result.count).toStrictEqual(3)
    expect(result.lastMonthCount).toStrictEqual(2)
  })
})
