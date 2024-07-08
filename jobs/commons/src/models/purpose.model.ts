import { z } from 'zod'

export const PurposeState = z.enum(['Active', 'Suspended', 'WaitingForApproval', 'Archived', 'Draft', 'Rejected'])

export const PurposeVersionDocument = z.object({
  id: z.string(),
  contentType: z.string(),
  path: z.string(),
  createdAt: z.string(),
})

export const PurposeVersion = z.object({
  id: z.string().uuid(),
  state: PurposeState,
  riskAnalysis: PurposeVersionDocument.optional(),
  dailyCalls: z.number(),
  createdAt: z.string().pipe(z.coerce.date()),
  updatedAt: z.string().pipe(z.coerce.date()).optional(),
  firstActivationAt: z.string().optional(),
  suspendedAt: z.string().pipe(z.coerce.date()).optional(),
})

export const RiskAnalysisSingleAnswer = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.string().optional(),
})

export const RiskAnalysisMultiAnswer = z.object({
  id: z.string().uuid(),
  key: z.string(),
  values: z.array(z.string()),
})

export const RiskAnalysisForm = z.object({
  id: z.string().uuid(),
  version: z.string(),
  singleAnswers: z.array(RiskAnalysisSingleAnswer),
  multiAnswers: z.array(RiskAnalysisMultiAnswer),
})

export const Purpose = z.object({
  id: z.string().uuid(),
  eserviceId: z.string().uuid(),
  consumerId: z.string().uuid(),
  versions: z.array(PurposeVersion),
  suspendedByConsumer: z.boolean().optional(),
  suspendedByProducer: z.boolean().optional(),
  title: z.string(),
  description: z.string(),
  riskAnalysisForm: z.unknown(),
  createdAt: z.string().pipe(z.coerce.date()),
  updatedAt: z.string().pipe(z.coerce.date()).optional(),
  isFreeOfCharge: z.boolean(),
  freeOfChargeReason: z.string().optional(),
})

export type PurposeState = z.infer<typeof PurposeState>
export type PurposeVersionDocument = z.infer<typeof PurposeVersionDocument>
export type PurposeVersion = z.infer<typeof PurposeVersion>
export type RiskAnalysisSingleAnswer = z.infer<typeof RiskAnalysisSingleAnswer>
export type RiskAnalysisMultiAnswer = z.infer<typeof RiskAnalysisMultiAnswer>
export type RiskAnalysisForm = z.infer<typeof RiskAnalysisForm>
export type Purpose = z.infer<typeof Purpose>

export const Purposes = z.array(Purpose)
export type Purposes = z.infer<typeof Purposes>
