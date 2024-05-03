import { ReadModelClient } from '@interop-be-reports/commons'
import { PersistentTenant } from '../model/tenant.model.js'
import { PersistentAttribute } from '../model/attribute.model.js'

const projectUnrevokedCertifiedAttributes = {
  _id: 0,
  'data.id': 1,
  'data.externalId': 1,
  'data.features': 1,
  'data.attributes': {
    $filter: {
      input: '$data.attributes',
      as: 'attribute',
      cond: {
        $and: [
          { $eq: ['$$attribute.type', 'PersistentCertifiedAttribute'] },
          { $ne: ['$$attribute.revocationTimestamp', null] },
        ],
      },
    },
  },
}

export class ReadModelQueries {
  constructor(private readModelClient: ReadModelClient) { }

  /**
   * Retrieve all PA tenants that matches the given IPA codes, with their unrevoked certified attribute
   */
  async getPATenants(ipaCodes: string[]): Promise<PersistentTenant[]> {
    return await this.readModelClient.tenants
      .aggregate([
        {
          $match: {
            'data.externalId.origin': 'IPA',
            'data.externalId.value': { $in: ipaCodes },
          },
        },
        {
          $project: projectUnrevokedCertifiedAttributes,
        },
      ])
      .map(({ data }) => PersistentTenant.parse(data))
      .toArray()
  }

  /**
   * Retrieve all non-PA tenants that matches the given tax codes, with their unrevoked certified attribute
   */
  async getNonPATenants(taxCodes: string[]): Promise<PersistentTenant[]> {
    return await this.readModelClient.tenants
      .aggregate([
        {
          $match: {
            'data.externalId.origin': { $ne: 'IPA' },
            'data.externalId.value': { $in: taxCodes },
          },
        },
        {
          $project: projectUnrevokedCertifiedAttributes,
        },
      ])
      .map(({ data }) => PersistentTenant.parse(data))
      .toArray()
  }

  async getTenantById(tenantId: string): Promise<PersistentTenant> {
    const result = await this.readModelClient.tenants
      .aggregate([
        {
          $match: {
            'data.id': tenantId,
          },
        },
        {
          $project: projectUnrevokedCertifiedAttributes,
        },
      ])
      .map(({ data }) => PersistentTenant.parse(data))
      .toArray()

    if (result.length === 0) throw Error(`Tenant with id ${tenantId} not found`)
    else return result[0]
  }

  async getAttributeByExternalId(origin: string, code: string): Promise<PersistentAttribute> {
    const result = await this.readModelClient.attributes
      .find(
        {
          'data.origin': origin,
          'data.code': code,
        },
        {
          projection: {
            _id: 0,
            'data.id': 1,
            'data.origin': 1,
            'data.code': 1,
          },
        }
      )
      .map(({ data }) => PersistentAttribute.parse(data))
      .toArray()

    if (result.length === 0) throw Error(`Attribute with origin ${origin} and code ${code} not found`)
    else return result[0]
  }

  async getTenantsWithAttributes(attributeIds: string[]): Promise<PersistentTenant[]> {
    return await this.readModelClient.tenants
      .aggregate([
        {
          $match: {
            'data.attributes.id': { $in: attributeIds },
          },
        },
        {
          $project: projectUnrevokedCertifiedAttributes,
        },
      ])
      .map(({ data }) => PersistentTenant.parse(data))
      .toArray()
  }

}
