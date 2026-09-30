import { NormalizedExtraction } from '../../types';
import { validateGS1CheckDigit } from '../normalize';

export interface SourceMatch {
  field: string;
  expected: string;
  observed: string;
  match: 'exact' | 'fuzzy' | 'none';
  score: number;
}

export interface SourceResult {
  sourceId: string;
  sourceName: string;
  isDemo: boolean;
  found: boolean;
  matches: SourceMatch[];
  evidenceUrl?: string;
  retrievedAt: string;
  error?: string;
}

export interface VerificationSource {
  id: string;
  name: string;
  kind: 'catalog' | 'recall' | 'alert' | 'manufacturer';
  isDemo: boolean;
  lastUpdated: string;
  lookup(query: NormalizedExtraction): Promise<SourceResult>;
}

// 1. Demo Catalog Adapter
export class DemoCatalogAdapter implements VerificationSource {
  id = 'demo-catalog';
  name = 'PranCare Demo Medicine Catalog (India)';
  kind: 'catalog' = 'catalog';
  isDemo = true;
  lastUpdated = '2026-09-01T00:00:00.000Z';

  private products = [
    {
      normalizedName: 'paracetamol',
      brandNames: ['demopar', 'crocin', 'calpol', 'dolo'],
      registeredManufacturer: 'demo',
      fullManufacturer: 'Demo Pharma Laboratories Ltd.',
      standardStrengths: [500, 650],
      licencePattern: /^DL-\d{4}-\d{4}$/
    },
    {
      normalizedName: 'amoxicillin',
      brandNames: ['mox', 'novamox', 'amoxil'],
      registeredManufacturer: 'demo',
      fullManufacturer: 'Demo Pharma Laboratories Ltd.',
      standardStrengths: [250, 500],
      licencePattern: /^DL-\d{4}-\d{4}$/
    },
    {
      normalizedName: 'metformin',
      brandNames: ['glycomet', 'gluformin'],
      registeredManufacturer: 'sun',
      fullManufacturer: 'Sun Pharma Ltd.',
      standardStrengths: [500, 850, 1000],
      licencePattern: /^MH-\d{4}-\d{4}$/
    },
    {
      normalizedName: 'amlodipine',
      brandNames: ['amlong', 'stamlo'],
      registeredManufacturer: 'cipla',
      fullManufacturer: 'Cipla Ltd.',
      standardStrengths: [2.5, 5, 10],
      licencePattern: /^MH-\d{4}-\d{4}$/
    },
    {
      normalizedName: 'atorvastatin',
      brandNames: ['atorva', 'lipitor'],
      registeredManufacturer: 'zydus',
      fullManufacturer: 'Zydus Life Care',
      standardStrengths: [10, 20, 40],
      licencePattern: /^GJ-\d{4}-\d{4}$/
    }
  ];

  async lookup(query: NormalizedExtraction): Promise<SourceResult> {
    const retrievedAt = new Date().toISOString();
    const queryName = query.medicineName || query.brandName || '';
    
    // Check if any product matches name or active ingredient
    const foundProduct = this.products.find((p) => {
      if (queryName && (p.normalizedName.includes(queryName) || queryName.includes(p.normalizedName))) return true;
      if (query.activeIngredients.some((ing) => p.normalizedName.includes(ing.name) || ing.name.includes(p.normalizedName))) return true;
      return false;
    });

    if (!foundProduct) {
      return {
        sourceId: this.id,
        sourceName: this.name,
        isDemo: this.isDemo,
        found: false,
        matches: [],
        retrievedAt
      };
    }

    const matches: SourceMatch[] = [
      {
        field: 'medicine_name',
        expected: foundProduct.normalizedName,
        observed: queryName,
        match: 'exact',
        score: 1.0
      }
    ];

    // Manufacturer check
    if (query.manufacturer) {
      const isMfrMatch = query.manufacturer.includes(foundProduct.registeredManufacturer) ||
                         foundProduct.registeredManufacturer.includes(query.manufacturer);
      matches.push({
        field: 'manufacturer',
        expected: foundProduct.fullManufacturer,
        observed: query.rawManufacturer || query.manufacturer,
        match: isMfrMatch ? 'exact' : 'none',
        score: isMfrMatch ? 1.0 : 0.0
      });
    }

    return {
      sourceId: this.id,
      sourceName: this.name,
      isDemo: this.isDemo,
      found: true,
      matches,
      retrievedAt
    };
  }
}

// 2. Demo Recall Adapter (CDSCO mock alerts)
export class DemoRecallAdapter implements VerificationSource {
  id = 'demo-recall';
  name = 'Central Drugs Standard Control Organisation (CDSCO) Public Alerts & Recalls';
  kind: 'recall' = 'recall';
  isDemo = true;
  lastUpdated = '2026-09-10T12:00:00.000Z';

  // Seeded list of recalled/NSQ (Not of Standard Quality) batches
  private recalledBatches = [
    {
      batchNumber: 'RC998877',
      medicineName: 'amoxicillin',
      manufacturer: 'Mismatch Pharma Trading Co.',
      reason: 'Batch failed assay test; dissolution parameter not of standard quality according to State Drugs Laboratory test report (Ref: CDSCO/NSQ/2026/08)',
      alertDate: '2026-08-15'
    },
    {
      batchNumber: 'AL554433',
      medicineName: 'paracetamol',
      manufacturer: 'Apex Spurious Unit',
      reason: 'Flagged under CDSCO monthly drug alert for sub-potent active ingredient content',
      alertDate: '2026-07-22'
    }
  ];

  async lookup(query: NormalizedExtraction): Promise<SourceResult> {
    const retrievedAt = new Date().toISOString();
    if (!query.batchNumber) {
      return {
        sourceId: this.id,
        sourceName: this.name,
        isDemo: this.isDemo,
        found: false,
        matches: [],
        retrievedAt
      };
    }

    const recall = this.recalledBatches.find(
      (r) => r.batchNumber.toUpperCase() === query.batchNumber!.toUpperCase()
    );

    if (recall) {
      return {
        sourceId: this.id,
        sourceName: this.name,
        isDemo: this.isDemo,
        found: true,
        evidenceUrl: 'https://cdsco.gov.in/opencms/opencms/en/Drugs/Alerts/',
        matches: [
          {
            field: 'batch_number',
            expected: `RECALLED: ${recall.reason}`,
            observed: query.batchNumber,
            match: 'none',
            score: 0.0
          }
        ],
        retrievedAt
      };
    }

    return {
      sourceId: this.id,
      sourceName: this.name,
      isDemo: this.isDemo,
      found: false,
      matches: [],
      retrievedAt
    };
  }
}

// 3. GS1 Barcode Adapter (local check digit + format validation)
export class GS1Adapter implements VerificationSource {
  id = 'gs1-validator';
  name = 'GS1 Healthcare Barcode Standard Specification';
  kind: 'catalog' = 'catalog';
  isDemo = false; // Real algorithmic specification
  lastUpdated = '2026-01-01T00:00:00.000Z';

  async lookup(query: NormalizedExtraction): Promise<SourceResult> {
    const retrievedAt = new Date().toISOString();
    if (!query.barcode) {
      return {
        sourceId: this.id,
        sourceName: this.name,
        isDemo: this.isDemo,
        found: false,
        matches: [],
        retrievedAt
      };
    }

    const isValid = validateGS1CheckDigit(query.barcode);
    return {
      sourceId: this.id,
      sourceName: this.name,
      isDemo: this.isDemo,
      found: true,
      matches: [
        {
          field: 'barcode_check_digit',
          expected: 'Valid GS1 Modulo-10 Check Digit',
          observed: query.barcode,
          match: isValid ? 'exact' : 'none',
          score: isValid ? 1.0 : 0.0
        }
      ],
      retrievedAt
    };
  }
}

// 4. Real Source Adapter Template (Documentation stub)
/**
 * RealSourceAdapterTemplate
 * 
 * Demonstrates how to plug in real public regulatory feeds:
 * - CDSCO Monthly Drug Alert notices (published as PDF / CSV tables)
 * - State Drug Control Administration registers
 * - WHO Substandard & Falsified Medical Products reports
 * 
 * In production without a live REST endpoint, run an ETL pipeline that
 * parses regulatory PDF/CSV bulletins and loads them into a structured database.
 */
export class RealSourceAdapterTemplate implements VerificationSource {
  id = 'real-cdsco-stub';
  name = 'CDSCO National Drug Registry (Production Adapter Template)';
  kind: 'catalog' = 'catalog';
  isDemo = false;
  lastUpdated = '2026-09-01T00:00:00.000Z';

  async lookup(query: NormalizedExtraction): Promise<SourceResult> {
    // TODO: In production, query the local replica of the CDSCO drug register
    return {
      sourceId: this.id,
      sourceName: this.name,
      isDemo: false,
      found: false,
      matches: [],
      retrievedAt: new Date().toISOString(),
      error: 'Real CDSCO registry connector requires verified enterprise certificate. Falling back to configured catalog.'
    };
  }
}

// Registry
export const verificationSources: VerificationSource[] = [
  new DemoCatalogAdapter(),
  new DemoRecallAdapter(),
  new GS1Adapter()
];
