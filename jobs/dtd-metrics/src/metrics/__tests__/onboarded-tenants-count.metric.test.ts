import { Tenant, getAttributeMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, readModelMock, repeatObjInArray, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getOnboardedTenantsCountMetric } from '../onboarded-tenants-count.metric.js'
import { getMonthsAgoDate } from '../../utils/helpers.utils.js'

type TenantMockArray = Array<{ data: Tenant }>

const comuniAttributeId = randomUUID()

describe('getOnboardedTenantsCountMetric', () => {
  it('should return the correct metrics', async () => {
    const _onboardedSixMonthsAgoTenants = repeatObjInArray(
      {
        data: getTenantMock({
          selfcareId: randomUUID(),
          onboardedAt: getMonthsAgoDate(6),
          attributes: [{ id: comuniAttributeId }],
          externalId: { origin: 'IPA' },
        }),
        attributes: [{ id: comuniAttributeId }],
      },
      10
    )

    const _notOnboardedTenant = getTenantMock({
      attributes: [{ id: comuniAttributeId }],
      externalId: { origin: 'IPA' },
    })
    delete _notOnboardedTenant.onboardedAt
    const _notOnboardedTenants = repeatObjInArray({ data: _notOnboardedTenant }, 10)

    const _onboardedLastMonthTenant = getTenantMock({
      onboardedAt: new Date(),
      attributes: [{ id: comuniAttributeId }],
      externalId: { origin: 'IPA' },
    })
    const _onboardedLastMonthTenants = repeatObjInArray({ data: _onboardedLastMonthTenant }, 2)

    const withRandomIds = (tenants: TenantMockArray): TenantMockArray => {
      return tenants.map((t) => ({ ...t, data: { ...t.data, id: randomUUID() } }))
    }

    const onboardedSixMonthsAgoTenants = withRandomIds(_onboardedSixMonthsAgoTenants as TenantMockArray)
    const notOnboardedTenants = withRandomIds(_notOnboardedTenants as TenantMockArray)
    const onboardedLastMonthTenants = withRandomIds(_onboardedLastMonthTenants as TenantMockArray)

    await Promise.all([
      seedCollection('tenants', onboardedSixMonthsAgoTenants),
      seedCollection('tenants', notOnboardedTenants),
      seedCollection('tenants', onboardedLastMonthTenants),
      seedCollection('attributes', [
        { data: getAttributeMock({ id: comuniAttributeId, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> }) },
      ]),
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getOnboardedTenantsCountMetric(readModelMock, globalStore)

    const allOnboardedTenants = onboardedSixMonthsAgoTenants.length + onboardedLastMonthTenants.length
    expect(result[0].totalCount).toBe(allOnboardedTenants)
    expect(result[0].lastMonthCount).toBe(onboardedLastMonthTenants.length)
  })
})
