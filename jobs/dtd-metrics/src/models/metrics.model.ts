import { z } from 'zod'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TimedMetric = <T extends z.ZodType>(schema: T) =>
  z.object({
    lastSixMonths: schema,
    lastTwelveMonths: schema,
    fromTheBeginning: schema,
  })

type TimedMetricType<T extends z.ZodType> = ReturnType<typeof TimedMetric<T>>
export type TimedMetric<T = unknown> = z.infer<TimedMetricType<z.ZodType<T>>>
export type TimedMetricKey = keyof TimedMetric

export const PublishedEServicesMetric = z.object({
  count: z.number(),
  lastMonthCount: z.number(),
  variation: z.number(),
})
export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>

export const EServicesByMacroCategoriesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
  })
)
export type EServicesByMacroCategoriesMetric = z.infer<typeof EServicesByMacroCategoriesMetric>

export const MostSubscribedEServicesMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          mostSubscribedEServices: z.array(
            z.object({
              eserviceName: z.string(),
              producerName: z.string(),
              subscribersCount: z.number(),
            })
          ),
        })
      ),
    })
  )
)
export type MostSubscribedEServicesMetric = z.infer<typeof MostSubscribedEServicesMetric>

export const TopProducersBySubscribersMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(
        z.object({
          producerName: z.string(),
          macroCategories: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              subscribersCount: z.number(),
            })
          ),
        })
      ),
    })
  )
)
export type TopProducersBySubscribersMetric = z.infer<typeof TopProducersBySubscribersMetric>

export const TenantDistributionMetric = z.array(
  z.object({
    activity: z.enum([
      'Enti solo fruitori',
      'Enti solo erogatori',
      'Enti sia fruitori che erogatori',
      'Enti con avviati gli sviluppi tecnici',
    ]),
    count: z.number(),
  })
)
export type TenantDistributionMetric = z.infer<typeof TenantDistributionMetric>

export const TenantOnboardingTrendMetric = z.array(z.object({ date: z.date(), count: z.number() }))
export type TenantOnboardingTrendMetric = z.infer<typeof TenantOnboardingTrendMetric>

export const MacroCategoriesOnboardingTrendMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(z.object({ date: z.date(), count: z.number() })),
      totalCount: z.number(),
      onboardedCount: z.number(),
      startingDate: z.date(),
    })
  )
)
export type MacroCategoriesOnboardingTrendMetric = z.infer<typeof MacroCategoriesOnboardingTrendMetric>

export const OnboardedTenantsCountMetric = z.tuple([
  z.object({
    name: z.literal('Totale enti'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal('Enti pubblici'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal('Enti privati'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[2].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[6].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[9].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[4].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal('Altri enti pubblici'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
])
export type OnboardedTenantsCountMetric = z.infer<typeof OnboardedTenantsCountMetric>

export const TopProducersMetricItem = z.object({
  producerName: z.string(),
  count: z.number(),
})

export type TopProducersMetricItem = z.infer<typeof TopProducersMetricItem>

export const TopProducersMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(TopProducersMetricItem),
    })
  )
)
export type TopProducersMetric = z.infer<typeof TopProducersMetric>

export const TotalTokensMetric = z.object({
  totalCount: z.number(),
  lastMonthCount: z.number(),
  variation: z.number(),
})
export type TotalTokensMetric = z.infer<typeof TotalTokensMetric>

export const TokensTrendMetric = TimedMetric(z.array(z.object({ date: z.date(), count: z.number() })))
export type TokensTrendMetric = z.infer<typeof TokensTrendMetric>

export const MostUsedEServicesMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(
        z.object({
          eserviceName: z.string(),
          producerName: z.string(),
          totalActiveConsumers: z.number(),
          activeConsumersByMacroCategory: z.array(z.object({ id: z.string(), name: z.string(), count: z.number() })),
        })
      ),
    })
  )
)
export type MostUsedEServicesMetric = z.infer<typeof MostUsedEServicesMetric>

export const EServicesWithMostTokensMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(
        z.object({ eserviceId: z.string(), eserviceName: z.string(), producerName: z.string(), tokenCount: z.number() })
      ),
    })
  )
)
export type EServicesWithMostTokensMetric = z.infer<typeof EServicesWithMostTokensMetric>

export const TotalConnectionsMetric = z.object({
  totalCount: z.number(),
  lastMonthCount: z.number(),
  variation: z.number(),
})
export type TotalConnectionsMetric = z.infer<typeof TotalConnectionsMetric>

export const Metric = z.union([
  z.object({ name: z.literal('totaleEnti'), data: OnboardedTenantsCountMetric }),
  z.object({ name: z.literal('andamentoDelleAdesioni'), data: TenantOnboardingTrendMetric }),
  z.object({ name: z.literal('andamentoDelleAdesioniPerCategoria'), data: MacroCategoriesOnboardingTrendMetric }),
  z.object({ name: z.literal('distribuzioneDegliEntiPerAttivita'), data: TenantDistributionMetric }),
  z.object({ name: z.literal('eservicePubblicati'), data: PublishedEServicesMetric }),
  z.object({ name: z.literal('entiErogatoriDiEService'), data: EServicesByMacroCategoriesMetric }),
  z.object({ name: z.literal('entiChePubblicanoPiuEService'), data: TopProducersMetric }),
  z.object({ name: z.literal('connessioniFraEnti'), data: TopProducersBySubscribersMetric }),
  z.object({ name: z.literal('eServicePiuRichiesti'), data: MostSubscribedEServicesMetric }),
  z.object({ name: z.literal('totaleRichiesteDiAccesso'), data: TotalTokensMetric }),
  z.object({ name: z.literal('attivitaDellaPiattaforma'), data: TokensTrendMetric }),
  z.object({ name: z.literal('eServicePiuUtilizzati'), data: MostUsedEServicesMetric }),
  z.object({ name: z.literal('eserviceConPiuTokenStaccati'), data: EServicesWithMostTokensMetric }),
  z.object({ name: z.literal('connessioniTotali'), data: TotalConnectionsMetric }),
])

export type Metric = z.infer<typeof Metric>
export type MetricName = Metric['name']
export type MetricData = Metric['data']
export type GetMetricData<T extends MetricName> = Extract<Metric, { name: T }>['data']
