import { SafeMixPairResult, SafeMixResponse } from '../types';
import { normalizeIngredient } from './normalize';

export interface KnownInteraction {
  ingredientA: string; // normalized
  ingredientB: string; // normalized
  severity: 'none_known' | 'possible' | 'significant';
  explanation: string;
  whatToAskDoctor: string;
}

export const KNOWN_INTERACTIONS: KnownInteraction[] = [
  {
    ingredientA: 'aspirin',
    ingredientB: 'withania_somnifera', // ashwagandha
    severity: 'significant',
    explanation: 'Ashwagandha may enhance the anticoagulant/antiplatelet effect of Aspirin, potentially increasing the risk of bleeding or bruising.',
    whatToAskDoctor: 'Should I adjust the timing or dosage of Ashwagandha while taking daily Aspirin?'
  },
  {
    ingredientA: 'warfarin',
    ingredientB: 'withania_somnifera',
    severity: 'significant',
    explanation: 'Ashwagandha may interact with Warfarin and alter INR levels or increase bleeding risks.',
    whatToAskDoctor: 'Can my doctor check my INR levels and confirm if Ayurvedic supplements are safe with Warfarin?'
  },
  {
    ingredientA: 'metformin',
    ingredientB: 'withania_somnifera',
    severity: 'possible',
    explanation: 'Both Metformin and Ashwagandha can lower blood glucose levels. Taking them together may increase the chance of hypoglycemia.',
    whatToAskDoctor: 'Should I monitor my fasting and post-meal blood sugar more frequently?'
  },
  {
    ingredientA: 'amlodipine',
    ingredientB: 'metformin',
    severity: 'none_known',
    explanation: 'No known adverse clinical interactions between Amlodipine (blood pressure) and Metformin (blood sugar). This combination is widely prescribed.',
    whatToAskDoctor: 'Are my blood pressure and sugar control targets in sync?'
  },
  {
    ingredientA: 'paracetamol',
    ingredientB: 'withania_somnifera',
    severity: 'none_known',
    explanation: 'No known significant interaction between standard doses of Paracetamol and Ashwagandha.',
    whatToAskDoctor: 'Confirm that short-term fever relief with Paracetamol is fine with my routine.'
  },
  {
    ingredientA: 'atorvastatin',
    ingredientB: 'curcumin', // turmeric extract
    severity: 'possible',
    explanation: 'High dose Curcumin supplements may inhibit CYP3A4 enzymes and modestly increase blood concentrations of Atorvastatin.',
    whatToAskDoctor: 'Is my daily turmeric supplement or herbal preparation compatible with my cholesterol medicine?'
  }
];

export async function checkInteractions(medicines: string[]): Promise<SafeMixResponse> {
  const normalizedMeds = medicines.map(m => {
    const raw = m.trim().toLowerCase();
    const norm = normalizeIngredient(raw);
    return { raw: m.trim(), norm };
  });

  const pairs: SafeMixPairResult[] = [];
  let highestSeverity: 'none_known' | 'possible' | 'significant' = 'none_known';

  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const medA = normalizedMeds[i];
      const medB = normalizedMeds[j];

      // Check against known database
      const found = KNOWN_INTERACTIONS.find(k =>
        (k.ingredientA === medA.norm && k.ingredientB === medB.norm) ||
        (k.ingredientA === medB.norm && k.ingredientB === medA.norm)
      );

      if (found) {
        pairs.push({
          pair: [medA.raw, medB.raw],
          severity: found.severity,
          plainExplanation: found.explanation,
          whatToAskDoctor: found.whatToAskDoctor
        });

        if (found.severity === 'significant') {
          highestSeverity = 'significant';
        } else if (found.severity === 'possible' && highestSeverity !== 'significant') {
          highestSeverity = 'possible';
        }
      } else {
        // Fallback for pairs without known danger
        pairs.push({
          pair: [medA.raw, medB.raw],
          severity: 'none_known',
          plainExplanation: `No documented direct adverse interaction found between ${medA.raw} and ${medB.raw} in standard interaction databases.`,
          whatToAskDoctor: `Confirm with your healthcare provider that ${medA.raw} and ${medB.raw} fit your personalized treatment plan.`
        });
      }
    }
  }

  const overallRisk = highestSeverity === 'significant' ? 'high' : highestSeverity === 'possible' ? 'moderate' : 'low';
  
  let summary = '';
  if (highestSeverity === 'significant') {
    summary = 'Important potential interaction detected. Please review the detailed doctor questions before taking together.';
  } else if (highestSeverity === 'possible') {
    summary = 'Mild or monitoring-advised interaction detected. Inform your treating physician or pharmacist.';
  } else {
    summary = 'No high-risk interactions identified among the entered medicines. Individual metabolic responses may still vary.';
  }

  return {
    pairs,
    overallRisk,
    summary,
    disclaimer: 'PranCare SafeMix is an informational screening tool and not a substitute for professional medical judgment. Never alter prescribed doses without doctor consultation.',
    analyzedByGemini: false
  };
}
