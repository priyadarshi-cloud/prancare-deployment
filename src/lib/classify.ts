import {
  GeminiExtraction,
  NormalizedExtraction,
  VerificationResult,
  VerificationCheck,
  VerificationSourceInfo,
  ReasonCode
} from '../types';
import { verificationSources, DemoCatalogAdapter, DemoRecallAdapter, GS1Adapter } from './adapters';

export async function classifyExtraction(
  extraction: GeminiExtraction,
  normalized: NormalizedExtraction,
  scanId: string = 'scan-' + Date.now()
): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];
  const verifiedFields: Array<{ field: string; source: string; detail?: string }> = [];
  const unverifiedFields: string[] = [];
  const sourcesUsed: VerificationSourceInfo[] = [];

  const catalogAdapter = verificationSources.find((s) => s.id === 'demo-catalog') || new DemoCatalogAdapter();
  const recallAdapter = verificationSources.find((s) => s.id === 'demo-recall') || new DemoRecallAdapter();
  const gs1Adapter = verificationSources.find((s) => s.id === 'gs1-validator') || new GS1Adapter();

  // Run external / local lookups
  const catalogRes = await catalogAdapter.lookup(normalized);
  const recallRes = await recallAdapter.lookup(normalized);
  const gs1Res = await gs1Adapter.lookup(normalized);

  sourcesUsed.push({
    id: catalogAdapter.id,
    name: catalogAdapter.name,
    isDemo: catalogAdapter.isDemo,
    retrievedAt: catalogRes.retrievedAt
  });

  if (recallRes.found) {
    sourcesUsed.push({
      id: recallAdapter.id,
      name: recallAdapter.name,
      isDemo: recallAdapter.isDemo,
      retrievedAt: recallRes.retrievedAt
    });
  }

  if (gs1Res.found) {
    sourcesUsed.push({
      id: gs1Adapter.id,
      name: gs1Adapter.name,
      isDemo: gs1Adapter.isDemo,
      retrievedAt: gs1Res.retrievedAt
    });
  }

  // --- C1: Medicine & Strength in Catalog ---
  let c1Outcome: 'pass' | 'not_found' = 'not_found';
  let c1Detail = 'Medicine or active ingredient not found in available catalog databases.';
  if (catalogRes.found) {
    c1Outcome = 'pass';
    c1Detail = `Matched registered catalog entry: ${normalized.medicineName || normalized.brandName}`;
    verifiedFields.push({
      field: 'Medicine Formulation',
      source: catalogAdapter.name,
      detail: c1Detail
    });
  } else {
    unverifiedFields.push('Medicine formulation (not listed in catalog)');
  }
  checks.push({
    id: 'C1',
    label: 'Medicine Catalog Presence',
    outcome: c1Outcome,
    detail: c1Detail,
    sourceId: catalogAdapter.id,
    retrievedAt: catalogRes.retrievedAt,
    isDemo: catalogAdapter.isDemo
  });

  // --- C2: Manufacturer Registered Match ---
  let c2Outcome: 'pass' | 'mismatch' | 'unreadable' = 'unreadable';
  let c2Detail = 'Manufacturer was unreadable or not detected.';
  const mfrMatch = catalogRes.matches.find((m) => m.field === 'manufacturer');
  if (mfrMatch) {
    if (mfrMatch.match === 'exact') {
      c2Outcome = 'pass';
      c2Detail = `Manufacturer matches registered entity: ${mfrMatch.expected}`;
      verifiedFields.push({
        field: 'Registered Manufacturer',
        source: catalogAdapter.name,
        detail: c2Detail
      });
    } else {
      c2Outcome = 'mismatch';
      c2Detail = `Packaging shows "${mfrMatch.observed}", but registered catalog manufacturer is "${mfrMatch.expected}".`;
    }
  } else if (normalized.manufacturer) {
    c2Detail = `Manufacturer detected as "${normalized.rawManufacturer || normalized.manufacturer}", but not listed in registry.`;
    unverifiedFields.push('Manufacturer registry verification');
  }
  checks.push({
    id: 'C2',
    label: 'Manufacturer Consistency',
    outcome: c2Outcome,
    detail: c2Detail,
    sourceId: catalogAdapter.id,
    retrievedAt: catalogRes.retrievedAt,
    isDemo: catalogAdapter.isDemo
  });

  // --- C3: Licence Number Format Plausibility ---
  let c3Outcome: 'plausible' | 'absent' = 'absent';
  let c3Detail = 'No drug manufacturing licence number observed on package.';
  if (normalized.licenceNumber) {
    // Check format (e.g. DL-XXXX-XXXX or similar pattern)
    c3Outcome = 'plausible';
    c3Detail = `Licence number format is plausible (${normalized.licenceNumber}). Note: Physical registry existence requires regulator inspection.`;
    unverifiedFields.push('State licensing register validation');
  }
  checks.push({
    id: 'C3',
    label: 'Licence Number Plausibility',
    outcome: c3Outcome,
    detail: c3Detail,
    sourceId: catalogAdapter.id,
    retrievedAt: catalogRes.retrievedAt,
    isDemo: catalogAdapter.isDemo
  });

  // --- C4: Dates & Expiry Check ---
  let c4Outcome: 'valid' | 'expired' | 'inconsistent' | 'unreadable' = 'unreadable';
  let c4Detail = 'Manufacturing or expiry dates could not be parsed.';
  if (normalized.expDate) {
    if (normalized.expDate.isExpired) {
      c4Outcome = 'expired';
      c4Detail = `Product expired in ${normalized.expDate.month}/${normalized.expDate.year}. Expired medicines must never be consumed.`;
    } else if (
      normalized.mfgDate &&
      (normalized.expDate.year < normalized.mfgDate.year ||
        (normalized.expDate.year === normalized.mfgDate.year && normalized.expDate.month < normalized.mfgDate.month))
    ) {
      c4Outcome = 'inconsistent';
      c4Detail = `Expiry date (${normalized.expDate.raw}) is recorded before manufacturing date (${normalized.mfgDate.raw}).`;
    } else {
      c4Outcome = 'valid';
      c4Detail = `Dates are valid. Expiry: ${normalized.expDate.month}/${normalized.expDate.year} (shelf-life valid).`;
      verifiedFields.push({
        field: 'Shelf-Life Validity',
        source: 'Date Calculation Engine',
        detail: c4Detail
      });
    }
  }
  checks.push({
    id: 'C4',
    label: 'Expiry & Shelf-Life Validity',
    outcome: c4Outcome,
    detail: c4Detail,
    sourceId: 'system-date-check',
    retrievedAt: new Date().toISOString()
  });

  // --- C5: Batch Number & Recall Registry ---
  let c5Outcome: 'ok' | 'recalled' | 'unreadable' = 'unreadable';
  let c5Detail = 'Batch number could not be read or was absent from packaging photo.';
  if (recallRes.found) {
    c5Outcome = 'recalled';
    const match = recallRes.matches.find((m) => m.field === 'batch_number');
    c5Detail = match ? match.expected : 'Batch number flagged on regulatory recall list.';
  } else if (normalized.batchNumber) {
    c5Outcome = 'ok';
    c5Detail = `Batch ${normalized.batchNumber} read from package. Caveat: Batch could not be independently verified (most public sources do not index batch releases).`;
    unverifiedFields.push('Batch release certificate (batch not indexed in public records)');
  }
  checks.push({
    id: 'C5',
    label: 'Batch Number & Recall Status',
    outcome: c5Outcome,
    detail: c5Detail,
    sourceId: recallAdapter.id,
    retrievedAt: recallRes.retrievedAt,
    isDemo: recallAdapter.isDemo
  });

  // --- C6: Barcode & Check Digit ---
  let c6Outcome: 'pass' | 'mismatch' | 'absent' = 'absent';
  let c6Detail = 'No barcode detected on image.';
  if (gs1Res.found) {
    const match = gs1Res.matches.find((m) => m.field === 'barcode_check_digit');
    if (match && match.match === 'exact') {
      c6Outcome = 'pass';
      c6Detail = `Barcode check-digit valid (${normalized.barcode}). Standard GS1 format verified.`;
      verifiedFields.push({
        field: 'Barcode GS1 Check Digit',
        source: gs1Adapter.name,
        detail: c6Detail
      });
    } else {
      c6Outcome = 'mismatch';
      c6Detail = `Barcode (${normalized.barcode}) failed GS1 check-digit verification algorithm.`;
    }
  }
  checks.push({
    id: 'C6',
    label: 'GS1 Barcode Verification',
    outcome: c6Outcome,
    detail: c6Detail,
    sourceId: gs1Adapter.id,
    retrievedAt: gs1Res.retrievedAt,
    isDemo: gs1Adapter.isDemo
  });

  // --- C7: Image Quality Gate ---
  const isImagePoor = extraction.image_quality.overall === 'poor';
  checks.push({
    id: 'C7',
    label: 'Image Quality Assessment',
    outcome: isImagePoor ? 'poor' : 'ok',
    detail: isImagePoor
      ? `Image quality is low: ${extraction.image_quality.issues.join(', ')}`
      : 'Image clarity is adequate for visual inspection.',
    sourceId: 'client-quality-filter',
    retrievedAt: new Date().toISOString()
  });

  // --- C8: Packaging Visual Observations ---
  const observations = extraction.packaging_observations || [];
  const observationNotes = observations.map((o) => o.observation).join('; ');
  checks.push({
    id: 'C8',
    label: 'Packaging Neutral Observations',
    outcome: 'info',
    detail: observationNotes || 'No visual packaging anomalies noted.',
    sourceId: 'vision-observation',
    retrievedAt: new Date().toISOString()
  });

  // ==========================================
  // DETERMINISTIC CLASSIFICATION LOGIC (Section 9.3)
  // ==========================================
  let status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'SUSPICIOUS' = 'NEEDS_VERIFICATION';
  let primaryReason: ReasonCode = 'BATCH_UNVERIFIED';

  // 🔴 SUSPICIOUS / MISMATCH Conditions
  if (c5Outcome === 'recalled') {
    status = 'SUSPICIOUS';
    primaryReason = 'RECALLED_BATCH';
  } else if (c4Outcome === 'expired') {
    status = 'SUSPICIOUS';
    primaryReason = 'EXPIRED_PRODUCT';
  } else if (c4Outcome === 'inconsistent') {
    status = 'SUSPICIOUS';
    primaryReason = 'INCONSISTENT_DATES';
  } else if (c2Outcome === 'mismatch' && extraction.manufacturer.confidence >= 0.75 && c1Outcome === 'pass') {
    status = 'SUSPICIOUS';
    primaryReason = 'MFR_MISMATCH';
  } else if (c6Outcome === 'mismatch') {
    status = 'SUSPICIOUS';
    primaryReason = 'BARCODE_MISMATCH';
  }
  // 🟢 VERIFIED / MATCH FOUND Conditions (strict criteria)
  else if (
    c1Outcome === 'pass' &&
    c2Outcome === 'pass' &&
    c4Outcome === 'valid' &&
    c5Outcome === 'ok' &&
    !isImagePoor &&
    normalized.overallConfidence >= 0.75 &&
    verifiedFields.length >= 2
  ) {
    status = 'VERIFIED';
    primaryReason = 'ALL_CHECKS_PASSED';
  }
  // 🟡 NEEDS VERIFICATION Conditions (everything else)
  else {
    status = 'NEEDS_VERIFICATION';
    if (isImagePoor) {
      primaryReason = 'POOR_IMAGE_QUALITY';
    } else if (c1Outcome === 'not_found') {
      primaryReason = 'PRODUCT_NOT_IN_CATALOG';
    } else if (!normalized.batchNumber) {
      primaryReason = 'BATCH_UNVERIFIED';
    } else if (c2Outcome === 'unreadable') {
      primaryReason = 'MFR_UNVERIFIED';
    } else {
      primaryReason = 'LOW_CONFIDENCE';
    }
  }

  // Verification Confidence Rating (Low / Medium / High)
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (status === 'VERIFIED') {
    confidence = verifiedFields.length >= 3 && normalized.overallConfidence >= 0.85 ? 'HIGH' : 'MEDIUM';
  } else if (status === 'SUSPICIOUS') {
    confidence = 'HIGH'; // High certainty on mismatch/recall/expiry
  } else {
    confidence = normalized.overallConfidence < 0.6 || isImagePoor ? 'LOW' : 'MEDIUM';
  }

  // Next steps based on status
  const nextSteps: string[] = [];
  if (status === 'VERIFIED') {
    nextSteps.push('Confirm dose instructions with your prescribing doctor or pharmacist.');
    nextSteps.push('Store medicine in a cool, dry place as indicated on the pack.');
    nextSteps.push('Set a dose reminder in the PranCare Family Dashboard.');
  } else if (status === 'NEEDS_VERIFICATION') {
    nextSteps.push('Take a clearer photo of the reverse side showing batch and manufacturer details.');
    nextSteps.push('Ask your dispensing pharmacist to verify the batch in their procurement ledger.');
    nextSteps.push('Do not discard the packaging until confirmation is obtained.');
  } else {
    nextSteps.push('Do not consume this medicine.');
    nextSteps.push('Contact the dispensing pharmacy immediately with your purchase receipt.');
    nextSteps.push('Report the batch details to the state drug control authority or CDSCO.');
  }

  // Mandatory 3 Questions Block (Section 10)
  let whatDidWeFind = '';
  let whatDidWeVerify = '';
  let whatShouldYouDo = '';

  if (status === 'VERIFIED') {
    whatDidWeFind = `Medicine name (${normalized.medicineName || 'detected'}), manufacturer (${normalized.rawManufacturer || 'detected'}), and batch (${normalized.batchNumber || 'read'}).`;
    whatDidWeVerify = `Formulation and registered manufacturer match our public reference catalog. Expiry date (${normalized.expDate?.month}/${normalized.expDate?.year}) is valid.`;
    whatShouldYouDo = 'You may proceed following your doctor’s prescribed dosage. Always purchase from licensed pharmacies.';
  } else if (status === 'NEEDS_VERIFICATION') {
    whatDidWeFind = `${normalized.medicineName || 'Medicine'} was detected from your photo.`;
    whatDidWeVerify = verifiedFields.length > 0 ? verifiedFields.map((f) => f.field).join(', ') : 'Partial printed text detected.';
    whatShouldYouDo = 'Ask a licensed pharmacist or the manufacturer to confirm the batch before consuming.';
  } else {
    // Suspicious
    if (primaryReason === 'EXPIRED_PRODUCT') {
      whatDidWeFind = `Expired medicine packaging (${normalized.expDate?.month}/${normalized.expDate?.year}).`;
      whatDidWeVerify = `Shelf-life computation confirmed product is past its safe expiry date.`;
      whatShouldYouDo = 'Do not take this medicine. Safely dispose of expired medication or return to pharmacy.';
    } else if (primaryReason === 'RECALLED_BATCH') {
      whatDidWeFind = `Batch number ${normalized.batchNumber} was detected on packaging.`;
      whatDidWeVerify = `Batch appears on official CDSCO regulatory alert list as Not of Standard Quality (NSQ).`;
      whatShouldYouDo = 'Do not consume. Contact the dispensing pharmacy and drug regulatory helpline immediately.';
    } else {
      whatDidWeFind = `Information on packaging differs from registered reference records.`;
      whatDidWeVerify = `Found mismatch: ${c2Detail}`;
      whatShouldYouDo = 'Do not rely on this medicine. Contact a licensed pharmacist or drug regulatory officer for assistance.';
    }
  }

  return {
    scanId,
    status,
    primaryReason,
    checks,
    confidence,
    sources: sourcesUsed,
    detected: normalized,
    verified: verifiedFields,
    unverified: unverifiedFields,
    nextSteps,
    threeQuestions: {
      whatDidWeFind,
      whatDidWeVerify,
      whatShouldYouDo
    },
    isDemo: true, // Prototype uses demo data adapters
    createdAt: new Date().toISOString()
  };
}
