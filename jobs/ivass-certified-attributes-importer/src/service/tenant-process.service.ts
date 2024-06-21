import axios from 'axios'
import { InteropContext } from '../model/interop-context.model.js'
import { logError } from '@interop-be-reports/commons'

export class TenantProcessService {
  constructor(private tenantProcessUrl: string) {}

  public async internalAssignCertifiedAttribute(
    tenantOrigin: string,
    tenantExternalId: string,
    attributeOrigin: string,
    attributeExternalId: string,
    context: InteropContext
  ): Promise<void> {
    const { data } = await axios
      .post<void>(
        `${this.tenantProcessUrl}/internal/origin/${tenantOrigin}/externalId/${tenantExternalId}/attributes/origin/${attributeOrigin}/externalId/${attributeExternalId}`,
        undefined,
        {
          headers: {
            'X-Correlation-Id': context.correlationId,
            Authorization: `Bearer ${context.bearerToken}`,
            'Content-Type': false,
          },
        }
      )
      .catch((err: Error) => {
        logError(context.correlationId, `Error on internalAssignCertifiedAttribute. Reason: ${err.message}`)
        throw Error(`Unexpected response from internalAssignCertifiedAttribute. Reason: ${err.message}`)
      })
    return data
  }

  public async internalRevokeCertifiedAttribute(
    tenantOrigin: string,
    tenantExternalId: string,
    attributeOrigin: string,
    attributeExternalId: string,
    context: InteropContext
  ): Promise<void> {
    const { data } = await axios
      .delete<void>(
        `${this.tenantProcessUrl}/internal/origin/${tenantOrigin}/externalId/${tenantExternalId}/attributes/origin/${attributeOrigin}/externalId/${attributeExternalId}`,
        {
          headers: {
            'X-Correlation-Id': context.correlationId,
            Authorization: `Bearer ${context.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      .catch((err: Error) => {
        logError(context.correlationId, `Error on internalRevokeCertifiedAttribute. Reason: ${err.message}`)
        throw Error(`Unexpected response from internalRevokeCertifiedAttribute. Reason: ${err.message}`)
      })
    return data
  }
}
