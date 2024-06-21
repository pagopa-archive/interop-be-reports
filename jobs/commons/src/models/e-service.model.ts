import { z } from 'zod'

const DescriptorAttribute = z.object({
  explicitAttributeVerification: z.boolean(),
  id: z.string().uuid(),
})

const DescriptorAttributes = z.object({
  certified: z.array(z.array(DescriptorAttribute)),
  verified: z.array(z.array(DescriptorAttribute)),
  declared: z.array(z.array(DescriptorAttribute)),
})

export const DescriptorState = z.enum(['Published', 'Draft', 'Deprecated', 'Suspended', 'Archived'])

export const CatalogDocument = z.object({
  id: z.string().uuid(),
  name: z.string(),
  contentType: z.string(),
  prettyName: z.string(),
  path: z.string(),
  checksum: z.string(),
  uploadDate: z.string().pipe(z.coerce.date()),
})
export type CatalogDocument = z.infer<typeof CatalogDocument>

export const AgreementApprovalPolicy = z.enum(['Automatic', 'Manual'])

export const EServiceDescriptor = z.object({
  id: z.string().uuid(),
  version: z.string(),
  description: z.string().optional(),
  interface: CatalogDocument.optional(),
  docs: z.array(CatalogDocument),
  state: DescriptorState,
  audience: z.array(z.string()),
  voucherLifespan: z.number(),
  dailyCallsPerConsumer: z.number(),
  dailyCallsTotal: z.number(),
  agreementApprovalPolicy: AgreementApprovalPolicy.optional(),
  createdAt: z.string().pipe(z.coerce.date()),
  serverUrls: z.array(z.string()),
  publishedAt: z.string().pipe(z.coerce.date()).optional(),
  suspendedAt: z.string().pipe(z.coerce.date()).optional(),
  deprecatedAt: z.string().pipe(z.coerce.date()).optional(),
  archivedAt: z.string().pipe(z.coerce.date()).optional(),
  attributes: DescriptorAttributes,
})

export const EService = z.object({
  id: z.string().uuid(),
  producerId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  technology: z.enum(['Rest', 'Soap']),
  attributes: DescriptorAttributes.optional(),
  descriptors: z.array(EServiceDescriptor),
  createdAt: z.string().pipe(z.coerce.date()),
  mode: z.enum(['Deliver', 'Receive']),
})

export type EService = z.infer<typeof EService>
export type EServiceDescriptor = z.infer<typeof EServiceDescriptor>
export type DescriptorAttribute = z.infer<typeof DescriptorAttribute>
export type DescriptorAttributes = z.infer<typeof DescriptorAttributes>
export type DescriptorState = z.infer<typeof DescriptorState>

export const EServices = z.array(EService)
export type EServices = z.infer<typeof EServices>
