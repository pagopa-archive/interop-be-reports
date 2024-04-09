import { Attribute, ExternalId, ReadModelClient } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES, REGIONI_E_PROVINCE_AUTONOME } from '../configs/macro-categories.js'
import { MacroCategories, MacroCategory, MacroCategoryTenant } from '../models/macro-categories.model.js'
import { z } from 'zod'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { URL } from 'url'
import { log } from '../utils/helpers.utils.js'
import { MacroCategoryName } from '../utils/tests.utils.js'

const __dirname = new URL('.', import.meta.url).pathname
const GLOBAL_STORE_CACHE_PATH = path.join(__dirname, '.global-store-cache')

const GlobalStoreTenant = MacroCategoryTenant
export type GlobalStoreTenant = z.infer<typeof GlobalStoreTenant>

const GlobalStoreCacheObj = z.object({
  macroCategories: MacroCategories,
  tenants: z.array(GlobalStoreTenant),
})

type GlobalStoreCacheObj = z.infer<typeof GlobalStoreCacheObj>

type GlobalStoreInitConfig = {
  cache?: boolean
}

/**
 * This service is used to retrieve and manage common used data
 * to avoid querying multiple times the read model for the same data.
 *
 * The initialization of this service is quite heavy, while developing
 * is recommended to use the cache option to avoid overloading the read model.
 */
export class GlobalStoreService {
  tenants: Array<GlobalStoreTenant>
  tenantsMap: Map<string, GlobalStoreTenant>
  macroCategories: MacroCategories

  public getMacroCategoryFromTenantId(tenantId: string): MacroCategory | undefined {
    return this.macroCategories.find(({ tenantsIds }) => tenantsIds.includes(tenantId))
  }

  public getTenantFromId(tenantId: string): GlobalStoreTenant | undefined {
    return this.tenantsMap.get(tenantId)
  }

  public getMacroCategoryByName(name: MacroCategoryName): MacroCategory {
    const macroCategory = this.macroCategories.find(({ name: macroCategoryName }) => macroCategoryName === name)
    if (!macroCategory) throw new Error(`Macro category ${name} not found`)
    return macroCategory
  }

  private constructor(tenants: Array<GlobalStoreTenant>, macroCategories: MacroCategories) {
    this.tenants = tenants
    this.tenantsMap = new Map(tenants.map((tenant) => [tenant.id, tenant]))
    this.macroCategories = macroCategories
  }

  /**
   * Initialize the service by querying the read model for the needed data.
   */
  static async init(readModel: ReadModelClient, config?: GlobalStoreInitConfig): Promise<GlobalStoreService> {
    // If cache is enabled, try to get the initialization data from the cache
    if (config?.cache) {
      const cache = this.getInitializationDataFromCache()
      if (cache) return new GlobalStoreService(cache.tenants, cache.macroCategories)
    }

    // Get all the attributes with at least one of the ipa codes of the macro categories
    const attributes = await readModel.attributes
      .find({
        'data.code': {
          $in: MACRO_CATEGORIES.flatMap((macroCategory) => macroCategory.ipaCodes),
        },
      })
      .project({
        _id: 0,
        'data.id': 1,
        'data.code': 1,
      })
      .map(({ data }) => Attribute.pick({ id: true, code: true }).parse(data))
      .toArray()

    // Get all the tenants that have at least one of the attributes found before
    const tenants = await readModel.tenants
      .find(
        {
          $or: [
            // IPA Tenants that belong to a macro category
            {
              'data.attributes.id': { $in: attributes.map(({ id }) => id) },
              'data.subUnitType': { $exists: false },
              'data.onboardedAt': { $exists: true },
            },
            // Private Tenants
            {
              'data.externalId.origin': { $ne: 'IPA' },
              'data.subUnitType': { $exists: false },
              'data.onboardedAt': { $exists: true },
            },
          ],
        },
        {
          projection: {
            _id: 0,
            'data.id': 1,
            'data.name': 1,
            'data.onboardedAt': 1,
            'data.externalId': 1,
            'data.attributes.id': 1,
            'data.attributes.revocationTimestamp': 1,
          },
        }
      )
      .map(({ data }) =>
        GlobalStoreTenant.omit({ macroCategoryId: true })
          .and(
            z.object({ attributes: z.array(z.object({ id: z.string(), revocationTimestamp: z.string().optional() })) })
          )
          .parse(data)
      )
      .toArray()

    const enrichMacroCategory = (macroCategory: (typeof MACRO_CATEGORIES)[number]): MacroCategory => {
      // Get all the attributes related to the macro category
      const macroCategoryAttributes = attributes
        .filter(({ code }) => (macroCategory.ipaCodes as ReadonlyArray<string | undefined>).includes(code))
        .map((attribute) => ({ ...attribute, macroCategoryId: macroCategory.id }))

      // Get all the tenants that have at least one of the macro category attributes
      const macroCategoryTenants = tenants.reduce<Array<GlobalStoreTenant>>((acc, next) => {
        const isTenantPrivate = next.externalId.origin !== 'IPA'
        const isTenantInMacroCategory = next.attributes.some(
          ({ id, revocationTimestamp }) => macroCategoryAttributes.some((a) => a.id === id) && !revocationTimestamp
        )
        if (!isTenantInMacroCategory && !isTenantPrivate) return acc

        // Get the macro category id for the tenant
        const macroCategoryId = assignMacrocategoryId(next, macroCategory.id, isTenantPrivate)
        // If the macro category id is not the same as the current macro category, skip it
        if (macroCategoryId !== macroCategory.id) return acc

        return [...acc, { ...next, macroCategoryId }]
      }, [])

      return MacroCategory.parse({
        ...macroCategory,
        attributes: macroCategoryAttributes,
        tenants: macroCategoryTenants,
        tenantsIds: Array.from(new Set(macroCategoryTenants.map(({ id }) => id))),
      })
    }

    const macroCategories = MACRO_CATEGORIES.map(enrichMacroCategory)
    const macroCategoryTenants = macroCategories.flatMap(({ tenants }) => tenants)

    // Log the tenants that are not in any macro category
    for (const tenant of tenants) {
      const isTenantInAnyMacroCategory = macroCategoryTenants.some(({ id }) => id === tenant.id)
      if (!isTenantInAnyMacroCategory) {
        log.warn(`Tenant ${tenant.name} (${tenant.id}) is not in any macro category`)
      }
    }

    if (config?.cache) this.cacheInitializationData({ macroCategories, tenants: macroCategoryTenants })
    return new GlobalStoreService(macroCategoryTenants, macroCategories)
  }

  private static getInitializationDataFromCache(): GlobalStoreCacheObj | undefined {
    const hasCache = existsSync(GLOBAL_STORE_CACHE_PATH)
    if (!hasCache) return undefined

    log.warn('Using global store cache')
    const cache = JSON.parse(readFileSync(GLOBAL_STORE_CACHE_PATH, 'utf-8'))
    const result = GlobalStoreCacheObj.safeParse(cache)
    if (!result.success) {
      log.warn('Global store cache is corrupted, ignoring it')
      return undefined
    }
    return result.data
  }

  private static cacheInitializationData(cache: GlobalStoreCacheObj): void {
    writeFileSync(GLOBAL_STORE_CACHE_PATH, JSON.stringify(cache))
  }
}

function assignMacrocategoryId(
  tenant: { externalId: ExternalId },
  macroCategoryId: MacroCategory['id'],
  isTenantPrivate: boolean
): MacroCategory['id'] {
  const regioniEProvinceAutonomeId = MACRO_CATEGORIES.find(({ name }) => name === 'Regioni e Province autonome')?.id
  const consorziEAssociazioniRegionaliId = MACRO_CATEGORIES.find(
    ({ name }) => name === 'Consorzi e associazioni regionali'
  )?.id
  const privatiId = MACRO_CATEGORIES.find(({ name }) => name === 'Enti privati')?.id

  if (!regioniEProvinceAutonomeId || !consorziEAssociazioniRegionaliId || !privatiId)
    throw new Error(
      'Macro categories Regioni e Province Autonome, Consorzi e associazioni regionali or Privati macro categories not found'
    )

  if (isTenantPrivate) return privatiId
  // If we are in a safe macrocategory, just assign it
  if (macroCategoryId !== regioniEProvinceAutonomeId && macroCategoryId !== consorziEAssociazioniRegionaliId)
    return macroCategoryId
  // If the Tenant is a Region or an Autonomy, assign the "Regioni e Province Autonome" macrocategory id
  if (REGIONI_E_PROVINCE_AUTONOME.includes(tenant.externalId?.value ?? '')) return regioniEProvinceAutonomeId
  // Assign the "Consorzi e associazioni regionali" to all others
  return consorziEAssociazioniRegionaliId
}
