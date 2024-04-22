import { MongoMemoryServer } from 'mongodb-memory-server'
import {
  Agreement,
  DescriptorState,
  EService,
  Purpose,
  ReadModelClient,
  Tenant,
  getAgreementMock,
  getEServiceMock,
  getPurposeMock,
  getTenantMock,
} from '@interop-be-reports/commons'
import { ReadModelQueriesService } from '../read-model-queries.service.js'

const DB_NAME = 'read-model'
let readModelMock: ReadModelClient
let mongoServer: MongoMemoryServer
let readModelQueriesService: ReadModelQueriesService

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: DB_NAME,
      auth: true,
    },
    auth: {
      customRootName: 'root',
      customRootPwd: 'root',
    },
  })

  readModelMock = await ReadModelClient.connect({
    readModelDbUser: mongoServer.auth?.customRootName as string,
    readModelDbPassword: mongoServer.auth?.customRootPwd as string,
    readModelDbHost: mongoServer.instanceInfo?.ip as string,
    readModelDbPort: mongoServer.instanceInfo?.port.toString() as string,
    readModelDbName: DB_NAME,
  })

  readModelQueriesService = new ReadModelQueriesService(readModelMock)
})

afterEach(async () => {
  await readModelMock.eservices.deleteMany({})
  await readModelMock.agreements.deleteMany({})
  await readModelMock.attributes.deleteMany({})
  await readModelMock.purposes.deleteMany({})
  await readModelMock.tenants.deleteMany({})
})

afterAll(async () => {
  await readModelMock?.close()
  await mongoServer?.stop()
})

async function seedCollection(
  collection: 'eservices' | 'agreements' | 'tenants' | 'purposes' | 'attributes',
  data: Array<{ data: unknown }>
): Promise<void> {
  await readModelMock[collection].insertMany(data as never)
}

describe('read-model-queries.service', () => {
  describe('getTenants', async () => {
    it('should return all tenants', async () => {
      const tenants: Array<Tenant> = [getTenantMock(), getTenantMock()]
      await seedCollection(
        'tenants',
        tenants.map((tenant) => ({ data: tenant }))
      )

      const result = await readModelQueriesService.getTenants()
      expect(result).toHaveLength(tenants.length)
    })

    it('should return empty array if no tenants are found', async () => {
      const result = await readModelQueriesService.getTenants()
      expect(result).toHaveLength(0)
    })

    it("should not return tenants without 'selfcareId'", async () => {
      const tenants: Array<Tenant> = [getTenantMock(), getTenantMock()]
      delete tenants[1].selfcareId
      await seedCollection(
        'tenants',
        tenants.map((tenant) => ({ data: tenant }))
      )

      const result = await readModelQueriesService.getTenants()
      expect(result).toHaveLength(1)
    })
  })

  describe('getEServices', async () => {
    function toReadModelEServices(
      eservices: Array<EService>
    ): Array<{ data: { id: string; descriptors: Array<{ state: DescriptorState }> } }> {
      return eservices.map((eservice) => ({ data: eservice }))
    }

    it('should return all eServices', async () => {
      const eservices = toReadModelEServices([getEServiceMock(), getEServiceMock()])

      await seedCollection('eservices', eservices)

      const result = await readModelQueriesService.getEServices()
      expect(result).toHaveLength(eservices.length)
    })

    it('should return empty array if no eServices are found', async () => {
      const result = await readModelQueriesService.getEServices()
      expect(result).toHaveLength(0)
    })

    it('should not return eServices with only one descriptor with Draft state', async () => {
      const eservices = toReadModelEServices([
        getEServiceMock(),
        getEServiceMock({ descriptors: [{ state: 'Draft' }] }),
      ])

      await seedCollection('eservices', eservices)

      const result = await readModelQueriesService.getEServices()
      expect(result).toHaveLength(1)
      expect(result[0].id).toEqual(eservices[0].data.id)
    })

    it('should not return eServices with no descriptors', async () => {
      const eservices = toReadModelEServices([getEServiceMock(), getEServiceMock()])

      eservices[1].data.descriptors = []

      await seedCollection('eservices', eservices)

      const result = await readModelQueriesService.getEServices()
      expect(result).toHaveLength(1)
      expect(result[0].id).toEqual(eservices[0].data.id)
    })
  })

  describe('getAgreements', async () => {
    function toReadModelAgreements(agreements: Array<Agreement>): Array<{ data: { state: string } }> {
      return agreements.map((agreement) => ({
        data: {
          ...agreement,
          createdAt: new Date().toISOString(),
        },
      }))
    }

    it('should return all agreements', async () => {
      const agreements = toReadModelAgreements([getAgreementMock(), getAgreementMock()])
      await seedCollection('agreements', agreements)

      const result = await readModelQueriesService.getAgreements()
      expect(result).toHaveLength(agreements.length)
    })

    it('should return empty array if no agreements are found', async () => {
      const result = await readModelQueriesService.getAgreements()
      expect(result).toHaveLength(0)
    })

    it("should not return agreements in 'Draft' state", async () => {
      const agreements = toReadModelAgreements([getAgreementMock(), getAgreementMock({ state: 'Draft' })])
      await seedCollection('agreements', agreements)

      const result = await readModelQueriesService.getAgreements()
      expect(result).toHaveLength(1)
    })
  })

  describe('getPurposes', async () => {
    function toReadModelPurposes(purposes: Array<Purpose>): Array<{ data: { id: string; versions: Array<unknown> } }> {
      return purposes.map((purpose) => ({
        data: {
          ...purpose,
          versions: purpose.versions.map((version) => ({
            ...version,
            createdAt: new Date().toISOString(),
          })),
          createdAt: new Date().toISOString(),
        },
      }))
    }

    it('should return all purposes', async () => {
      const purposes = toReadModelPurposes([getPurposeMock(), getPurposeMock()])

      await seedCollection('purposes', purposes)

      const result = await readModelQueriesService.getPurposes()
      expect(result).toHaveLength(purposes.length)
    })

    it('should return empty array if no purposes are found', async () => {
      const result = await readModelQueriesService.getPurposes()
      expect(result).toHaveLength(0)
    })

    it("should not return purposes with only one version in 'Draft' or 'WaitingForApproval' state", async () => {
      const purposes = toReadModelPurposes([
        getPurposeMock(),
        getPurposeMock({ versions: [{ state: 'WaitingForApproval' }] }),
        getPurposeMock({ versions: [{ state: 'Draft' }] }),
      ])

      await seedCollection('purposes', purposes)

      const result = await readModelQueriesService.getPurposes()

      expect(result).toHaveLength(1)
      expect(result[0].id).toEqual(purposes[0].data.id)
    })

    it('should not return purposes with no versions', async () => {
      const purposes = toReadModelPurposes([getPurposeMock(), getPurposeMock()])

      purposes[1].data.versions = []

      await seedCollection('purposes', purposes)

      const result = await readModelQueriesService.getPurposes()

      expect(result).toHaveLength(1)
      expect(result[0].id).toEqual(purposes[0].data.id)
    })
  })
})
