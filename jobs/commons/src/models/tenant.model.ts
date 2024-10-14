import { z } from 'zod'

export const TenantCertifiedAttribute = z.object({
  assignmentTimestamp: z.string().pipe(z.coerce.date()),
  revocationTimestamp: z.string().pipe(z.coerce.date()).optional(),
  id: z.string().uuid(),
  type: z.literal('PersistentCertifiedAttribute'),
})

export const TenantVerifiedAttribute = z.object({
  assignmentTimestamp: z.string().pipe(z.coerce.date()),
  id: z.string().uuid(),
  type: z.literal('PersistentVerifiedAttribute'),
  verifiedBy: z
    .array(
      z.object({
        id: z.string().uuid(),
        verificationDate: z.string().pipe(z.coerce.date()),
      })
    )
    .optional(),
  revokedBy: z
    .array(
      z.object({
        expirationDate: z.string().pipe(z.coerce.date()).optional(),
        extensionDate: z.string().pipe(z.coerce.date()).optional(),
        id: z.string().uuid(),
        revocationDate: z.string().pipe(z.coerce.date()),
        verificationDate: z.string().pipe(z.coerce.date()),
      })
    )
    .optional(),
})

export const TenantDeclaredAttribute = z.object({
  assignmentTimestamp: z.string().pipe(z.coerce.date()),
  revocationTimestamp: z.string().pipe(z.coerce.date()).optional(),
  id: z.string().uuid(),
  type: z.literal('PersistentDeclaredAttribute'),
})

export const TenantAttribute = z.union([TenantCertifiedAttribute, TenantVerifiedAttribute, TenantDeclaredAttribute])

export const ExternalId = z.object({
  origin: z.string(),
  value: z.string(),
})

export const TenantMail = z.object({
  address: z.string(),
  description: z.string().optional(),
  createdAt: z.string().pipe(z.coerce.date()),
  kind: z.enum(['CONTACT_EMAIL']),
})

export const PersistentTenantFeatureCertifier = z.object({
  type: z.literal('PersistentCertifier'),
  certifierId: z.string(),
})

export const PersistentTenantFeatureOther = z.object({
  type: z.string(),
})

export const PersistentTenantFeature = z.union([PersistentTenantFeatureCertifier, PersistentTenantFeatureOther])

export const Tenant = z.object({
  id: z.string().uuid(),
  kind: z.enum(['PA', 'GSP', 'PRIVATE']).optional(),
  selfcareId: z.string().optional(),
  externalId: ExternalId,
  features: z.array(PersistentTenantFeature),
  attributes: z.array(TenantAttribute),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  onboardedAt: z.coerce.date().optional(),
  mails: z.array(TenantMail),
  name: z.string(),
})

export type TenantCertifiedAttribute = z.infer<typeof TenantCertifiedAttribute>
export type TenantVerifiedAttribute = z.infer<typeof TenantVerifiedAttribute>
export type TenantDeclaredAttribute = z.infer<typeof TenantDeclaredAttribute>
export type TenantAttribute = z.infer<typeof TenantAttribute>
export type ExternalId = z.infer<typeof ExternalId>
export type TenantMail = z.infer<typeof TenantMail>
export type PersistentTenantFeatureCertifier = z.infer<typeof PersistentTenantFeatureCertifier>
export type PersistentTenantFeatureOther = z.infer<typeof PersistentTenantFeatureOther>
export type Tenant = z.infer<typeof Tenant>

export const Tenants = z.array(Tenant)
export type Tenants = z.infer<typeof Tenants>
