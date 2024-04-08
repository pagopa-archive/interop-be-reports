import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { OnboardedTenantsCountMetric } from '../models/metrics.model.js'
import { GlobalStoreService } from '../services/global-store.service.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'

export const getOnboardedTenantsCountMetric: MetricFactoryFn<'totaleEnti'> = (_readModel, globalStore) => {
  return OnboardedTenantsCountMetric.parse([
    getMetricData('Totale enti', globalStore),
    getMetricData('Pubblici', globalStore),
    getMetricData('Privati', globalStore),
    getMetricData('Comuni', globalStore),
    getMetricData('Regioni e Province autonome', globalStore),
    getMetricData('Università e AFAM', globalStore),
    getMetricData('Pubbliche Amministrazioni Centrali', globalStore),
    getMetricData('Altri enti pubblici', globalStore),
  ])
}

function getMetricData(
  name: OnboardedTenantsCountMetric[number]['name'],
  globalStore: GlobalStoreService
): OnboardedTenantsCountMetric[number] {
  let tenants: Array<{ onboardedAt: Date }>

  const otherMacroCategories: (typeof MACRO_CATEGORIES)[number]['name'][] = [
    'Altre Pubbliche Amministrazioni locali',
    'Aziende Ospedaliere e ASL',
    'Province e Città Metropolitane',
    'Enti Nazionali di Previdenza ed Assistenza Sociale',
    'Consorzi e associazioni regionali',
    'Scuole',
    'Istituti di Ricerca',
    'Stazioni Appaltanti e Gestori di pubblici servizi',
  ]

  switch (name) {
    case 'Totale enti':
      tenants = globalStore.tenants
      break
    case 'Pubblici':
      tenants = globalStore.tenants.filter((t) => t.externalId.origin === 'IPA')
      break
    case 'Altri enti pubblici':
      tenants = otherMacroCategories.flatMap(
        (macroCategoryName) => globalStore.getMacroCategoryByName(macroCategoryName).tenants
      )
      break
    default:
      tenants = globalStore.getMacroCategoryByName(name).tenants
  }

  const totalCount = tenants.length
  const lastMonthCount = getLastMonthTenantsCount(tenants)
  const variation = getVariationPercentage(lastMonthCount, totalCount)

  return {
    name,
    totalCount,
    lastMonthCount,
    variation,
  }
}

function getLastMonthTenantsCount<TTenant extends { onboardedAt: Date }>(tenants: Array<TTenant>): number {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  return tenants.filter((tenant) => tenant.onboardedAt >= oneMonthAgoDate).length
}
