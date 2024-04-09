import { getMonthsAgoDate, getOldestDate, toTimeseriesSequenceData } from '../utils/helpers.utils.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { MacroCategoriesOnboardingTrendMetric } from '../models/metrics.model.js'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'

export const getMacroCategoriesOnboardingTrendMetric: MetricFactoryFn<'andamentoDelleAdesioniPerCategoria'> = (
  _readModel,
  globalStore
) => {
  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)

  // Get the oldest tenant date, which will be used as the starting point for the timeseries
  const oldestTenantDate = getOldestDate(globalStore.tenants.map((tenant) => tenant.onboardedAt))

  // Remove the 'Privati' macro category, which is not relevant for this metric
  const macroCategories = globalStore.macroCategories.filter(
    (macroCategory) => macroCategory.name !== ('Enti privati' satisfies (typeof MACRO_CATEGORIES)[number]['name'])
  )

  return MacroCategoriesOnboardingTrendMetric.parse({
    lastSixMonths: macroCategories.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: sixMonthsAgoDate,
        jump: { days: 5 },
        data: macroCategory.tenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.tenants.length,
      startingDate: sixMonthsAgoDate,
    })),
    lastTwelveMonths: macroCategories.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: twelveMonthsAgoDate,
        jump: { days: 10 },
        data: macroCategory.tenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.tenants.length,
      startingDate: twelveMonthsAgoDate,
    })),
    fromTheBeginning: macroCategories.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: oldestTenantDate,
        jump: { months: 1 },
        data: macroCategory.tenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.tenants.length,
      startingDate: oldestTenantDate,
    })),
  })
}
