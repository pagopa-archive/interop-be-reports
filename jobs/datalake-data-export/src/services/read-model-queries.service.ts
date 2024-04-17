import { AgreementState, DescriptorState, PurposeState, ReadModelClient } from '@interop-be-reports/commons'
import { ExportedAgreement, ExportedEService, ExportedPurpose, ExportedTenant } from '../models.js'

export class ReadModelQueriesService {
  constructor(private readonly readModel: ReadModelClient) {}

  public async getTenants(): Promise<Array<ExportedTenant>> {
    return this.readModel.tenants
      .find({ 'data.selfcareId': { $exists: true } })
      .map(({ data }) => ExportedTenant.parse(data))
      .toArray()
  }

  public async getEServices(): Promise<Array<ExportedEService>> {
    return this.readModel.eservices
      .find({
        $nor: [
          {
            'data.descriptors': { $size: 0 },
          },
          {
            'data.descriptors': {
              $size: 1,
              state: 'Draft' satisfies DescriptorState,
            },
          },
        ],
      })
      .map(({ data }) => ExportedEService.parse(data))
      .toArray()
  }

  public async getAgreements(): Promise<Array<ExportedAgreement>> {
    return this.readModel.agreements
      .find({
        $not: [{ 'data.state': 'Draft' satisfies AgreementState }],
      })
      .map(({ data }) => ExportedAgreement.parse(data))
      .toArray()
  }

  public async getPurposes(): Promise<Array<ExportedPurpose>> {
    return this.readModel.purposes
      .find({
        $not: [{ 'data.state': 'Draft' satisfies PurposeState }],
      })
      .map(({ data }) => ExportedPurpose.parse(data))
      .toArray()
  }
}
