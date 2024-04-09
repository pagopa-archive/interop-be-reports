import { AgreementState } from '@interop-be-reports/commons'
import { TenantDistributionMetric } from '../models/metrics.model.js'
import { z } from 'zod'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

export const getTenantDistributionMetric: MetricFactoryFn<'distribuzioneDegliEntiPerAttivita'> = async (
  readModel,
  globalStore
) => {
  const agreementConsumers = await readModel.agreements
    .find({ 'data.state': { $in: ['Active', 'Suspended'] satisfies Array<AgreementState> } })
    .map(({ data }) => z.string().parse(data.consumerId))
    .toArray()

  const eserviceProducers = await readModel.eservices
    .find({ 'data.descriptors.state': { $in: ['Published', 'Suspended'] } })
    .map(({ data }) => z.string().parse(data.producerId))
    .toArray()

  const consumers = new Set(agreementConsumers)
  const producers = new Set(eserviceProducers)

  function checkIsConsumer(tenantId: string): boolean {
    return consumers.has(tenantId)
  }

  function checkIsProducer(tenantId: string): boolean {
    return producers.has(tenantId)
  }

  type TenantDistributionItem = TenantDistributionMetric[number]

  const onlyConsumers: TenantDistributionItem = {
    activity: 'Enti solo fruitori',
    count: 0,
  }

  const onlyProducers: TenantDistributionItem = {
    activity: 'Enti solo erogatori',
    count: 0,
  }

  const bothConsumersAndProducers: TenantDistributionItem = {
    activity: 'Enti sia fruitori che erogatori',
    count: 0,
  }

  const onlyAccess: TenantDistributionItem = {
    activity: 'Enti con avviati gli sviluppi tecnici',
    count: 0,
  }

  function resolveTenantDistribution<TTenant extends { id: string }>({ id }: TTenant): void {
    const isTenantProducer = checkIsProducer(id)
    const isTenantConsumer = checkIsConsumer(id)

    if (isTenantProducer && isTenantConsumer) bothConsumersAndProducers.count++
    else if (isTenantProducer) onlyProducers.count++
    else if (isTenantConsumer) onlyConsumers.count++
    else onlyAccess.count++
  }

  globalStore.tenants.forEach(resolveTenantDistribution)

  return [onlyConsumers, onlyProducers, bothConsumersAndProducers, onlyAccess]
}
