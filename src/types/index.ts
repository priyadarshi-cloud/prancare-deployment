import { z } from 'zod';

export const FieldWithValueSchema = z.object({
  value: z.string().nullable(),
  confidence: z.number().default(0.0)
});

export const BarcodeFieldSchema = z.object({
  value: z.string().nullable(),
  type: z.string().nullable().default(null),
  confidence: z.number().default(0.0)
});

export const ActiveIngredientSchema = z.object({
  name: z.string(),
  strength: z.string().default(''),
  confidence: z.number().default(0.0)
});

export const PackagingObservationSchema = z.object({
  observation: z.string(),
  severity: z.enum(['info', 'note']).default('info')
});

export const ImageQualitySchema = z.object({
  overall: z.enum(['good', 'fair', 'poor']).default('good'),
  issues: z.array(z.string()).default([])
});

export const GeminiExtractionSchema = z.object({
  medicine_name: FieldWithValueSchema,
  brand_name: FieldWithValueSchema,
  active_ingredients: z.array(ActiveIngredientSchema).default([]),
  dosage_form: FieldWithValueSchema,
  manufacturer: FieldWithValueSchema,
  marketed_by: FieldWithValueSchema,
  manufacturing_date: FieldWithValueSchema,
  expiry_date: FieldWithValueSchema,
  batch_number: FieldWithValueSchema,
  licence_number: FieldWithValueSchema,
  barcode_or_qr: BarcodeFieldSchema,
  mrp: FieldWithValueSchema,
  warnings_printed: z.array(z.string()).default([]),
  packaging_observations: z.array(PackagingObservationSchema).default([]),
  image_quality: ImageQualitySchema,
  fields_not_visible: z.array(z.string()).default([])
});

export type GeminiExtraction = z.infer<typeof GeminiExtractionSchema>;

export type ReasonCode =
  | 'ALL_CHECKS_PASSED'
  | 'RECALLED_BATCH'
  | 'MFR_MISMATCH'
  | 'EXPIRED_PRODUCT'
  | 'INCONSISTENT_DATES'
  | 'BARCODE_MISMATCH'
  | 'PRODUCT_NOT_IN_CATALOG'
  | 'MFR_UNVERIFIED'
  | 'BATCH_UNVERIFIED'
  | 'POOR_IMAGE_QUALITY'
  | 'LOW_CONFIDENCE'
  | 'OFFLINE_QUEUED';

export interface VerificationCheck {
  id: string; // C1, C2, C3, C4, C5, C6, C7, C8
  label: string;
  outcome: 'pass' | 'valid' | 'mismatch' | 'recalled' | 'expired' | 'inconsistent' | 'unreadable' | 'not_found' | 'plausible' | 'implausible' | 'absent' | 'ok' | 'poor' | 'info';
  detail?: string;
  sourceId?: string;
  retrievedAt?: string;
  isDemo?: boolean;
}

export interface VerificationSourceInfo {
  id: string;
  name: string;
  isDemo: boolean;
  retrievedAt: string;
}

export interface NormalizedExtraction {
  medicineName: string | null;
  brandName: string | null;
  activeIngredients: Array<{ name: string; strengthAmount?: number; strengthUnit?: string; raw: string }>;
  dosageForm: string | null;
  manufacturer: string | null;
  rawManufacturer: string | null;
  mfgDate: { month: number; year: number; raw: string } | null;
  expDate: { month: number; year: number; raw: string; isExpired: boolean } | null;
  batchNumber: string | null;
  licenceNumber: string | null;
  barcode: string | null;
  overallConfidence: number;
  qualityIssues: string[];
}

export interface VerificationResult {
  scanId: string;
  status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'SUSPICIOUS';
  primaryReason: ReasonCode;
  checks: VerificationCheck[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  sources: VerificationSourceInfo[];
  detected: NormalizedExtraction;
  verified: Array<{ field: string; source: string; detail?: string }>;
  unverified: string[];
  nextSteps: string[];
  threeQuestions: {
    whatDidWeFind: string;
    whatDidWeVerify: string;
    whatShouldYouDo: string;
  };
  plainExplanation?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface SafeMixPairResult {
  pair: [string, string];
  severity: 'none_known' | 'possible' | 'significant' | 'unknown';
  plainExplanation: string;
  whatToAskDoctor: string;
}

export interface SafeMixResponse {
  pairs: SafeMixPairResult[];
  overallRisk: 'low' | 'moderate' | 'high';
  summary: string;
  disclaimer: string;
  analyzedByGemini: boolean;
}
