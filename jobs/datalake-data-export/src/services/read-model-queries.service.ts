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
        $or: [
          {
            'data.descriptors.1': { $exists: true },
          },
          {
            'data.descriptors': {
              $size: 1,
              $elemMatch: {
                state: { $in: ['Published', 'Archived', 'Suspended', 'Deprecated'] satisfies DescriptorState[] },
              },
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
        'data.state': { $ne: 'Draft' satisfies AgreementState },
      })
      .map(({ data }) => ExportedAgreement.parse(data))
      .toArray()
  }

  public async getPurposes(): Promise<Array<ExportedPurpose>> {
    return this.readModel.purposes
      .find({
        $or: [
          {
            'data.versions.1': { $exists: true },
          },
          {
            'data.versions': {
              $size: 1,
              $elemMatch: {
                state: { $in: ['Active', 'Archived', 'Suspended', 'Rejected'] satisfies PurposeState[] },
              },
            },
          },
        ],
      })
      .map(({ data }) => ExportedPurpose.parse(data))
      .toArray()
  }
}
