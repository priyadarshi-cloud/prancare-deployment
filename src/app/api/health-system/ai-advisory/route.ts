import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // 1. Fetch current live supply facts from SQLite
    const criticalItems = db.prepare(`
      SELECT 
        i.medicine_name, i.current_stock, i.daily_consumption_rate, i.days_of_supply,
        f.name as facility_name, f.district, f.tier
      FROM supply_inventory i
      JOIN supply_facilities f ON i.facility_id = f.id
      WHERE i.stock_status = 'CRITICAL'
      ORDER BY i.days_of_supply ASC
    `).all() as any[];

    const surplusItems = db.prepare(`
      SELECT 
        i.medicine_name, i.current_stock, i.days_of_supply, i.expiry_date,
        f.name as facility_name, f.district, f.tier
      FROM supply_inventory i
      JOIN supply_facilities f ON i.facility_id = f.id
      WHERE i.stock_status = 'SURPLUS'
      ORDER BY i.days_of_supply DESC
    `).all() as any[];

    const activeForecasts = db.prepare(`
      SELECT 
        fc.medicine_name, fc.projected_demand, fc.current_stock, fc.projected_deficit,
        fc.predicted_stockout_date, fc.surge_factor_reason,
        f.name as facility_name, f.district
      FROM supply_forecasts fc
      JOIN supply_facilities f ON fc.facility_id = f.id
      WHERE fc.projected_deficit < 0
    `).all() as any[];

    // 2. Deterministic high-fidelity fallback advisory
    const deterministicAdvisory = {
      headline: 'Urgent Supply Rebalancing: 3 Critical Stockouts Threaten Primary Care Access',
      generatedAt: new Date().toISOString(),
      source: 'deterministic-fallback',
      summary: 'Automated pharmacovigilance analysis identifies severe antibiotic and antipyretic deficits at Daryaganj PHC and Hazratganj CHC. Concurrently, South Delhi DH and King George DH hold large surplus buffers with approaching expiry windows. Immediate cross-district redistribution resolves the deficit before zero-stock occurs.',
      priorityAlerts: [
        {
          facility: 'Daryaganj Primary Health Centre',
          district: 'Central Delhi',
          medicine: 'Amoxicillin 500mg',
          daysRemaining: 3.0,
          riskLevel: 'CRITICAL',
          urgencyReason: 'Respiratory viral surge caused 40% spike in outpatient antibiotic prescriptions; stock exhausts within 72 hours.',
        },
        {
          facility: 'Daryaganj Primary Health Centre',
          district: 'Central Delhi',
          medicine: 'Paracetamol 500mg',
          daysRemaining: 4.0,
          riskLevel: 'CRITICAL',
          urgencyReason: 'Post-monsoon seasonal pyrexia surge depleting reserve; stock will hit zero in 96 hours without resupply.',
        },
        {
          facility: 'Hazratganj Community Health Centre',
          district: 'Lucknow',
          medicine: 'Azithromycin 500mg',
          daysRemaining: 5.0,
          riskLevel: 'CRITICAL',
          urgencyReason: 'Acute bronchitis cluster in central municipal ward has outpaced standard monthly replenishment rate.',
        },
        {
          facility: 'Kankarbagh Community Health Centre',
          district: 'Patna',
          medicine: 'Insulin Regular 100IU',
          daysRemaining: 5.6,
          riskLevel: 'CRITICAL',
          urgencyReason: 'Cold-chain vial reserve low for chronic insulin-dependent diabetic cohort; buffer under 6 days.',
        },
      ],
      redistributionStrategies: [
        {
          action: 'Cross-District Intrastate Dispatch',
          fromFacility: 'South Delhi District Hospital',
          toFacility: 'Daryaganj Primary Health Centre',
          medicine: 'Amoxicillin 500mg',
          units: 2500,
          expectedImpact: 'Extends Daryaganj PHC supply by +50 days while leaving South Delhi DH with 50+ days reserve.',
          spoilageMitigation: 'Prioritizes South Delhi batch AMX-2026-03 expiring in 4 months, converting potential expiration loss into utilized clinical doses.',
        },
        {
          action: 'District Buffer Equalization',
          fromFacility: 'South Delhi District Hospital',
          toFacility: 'Daryaganj Primary Health Centre',
          medicine: 'Paracetamol 500mg',
          units: 3000,
          expectedImpact: 'Injects 30 days of antipyretic runway into Daryaganj without requiring emergency commercial purchase orders.',
          spoilageMitigation: 'Maintains optimal first-in-first-out (FIFO) inventory turnover.',
        },
        {
          action: 'Intra-District Rapid Transfer',
          fromFacility: 'King George District Hospital',
          toFacility: 'Hazratganj Community Health Centre',
          medicine: 'Azithromycin 500mg',
          units: 1200,
          expectedImpact: 'Short 6.5 km transport eliminates CHC antibiotic stockout within 2 hours of dispatch.',
          spoilageMitigation: 'Absorbs surplus from tertiary hospital store to relieve primary community caseload.',
        },
      ],
      procurementRecommendations: [
        'Issue advance indent to State Medical Corporation for cold-chain Insulin Regular 100IU in Bihar corridor.',
        'Review ORS packet replenishment schedules in riverbank municipal wards experiencing monsoon water quality shifts.',
        'Adopt automated inter-facility stock balancing as standard operating procedure to reduce district-level procurement wastage by ~22%.',
      ],
      disclaimer: 'Prototype Demonstration: Recommendations are generated based on synthetic district/facility supply data for hackathon evaluation.',
    };
    // 3. Attempt Gemini API call if key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ...deterministicAdvisory,
        label: 'Demo data — synthetic district/facility supply data',
      });
    }

    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const promptText = `You are a Smart Public Health Supply Chain & Pharmacovigilance AI for Indian public health logistics.
Analyze only the healthcare supply data provided below.
Identify urgent stock risks, useful redistribution opportunities, and procurement recommendations.
Return only data matching the required JSON response schema.
Do not invent facilities, medicines, stock levels, districts, or quantities that are not supported by the supplied data.

CRITICAL DEFICIT FACILITIES (Stock < 7 days):
${JSON.stringify(criticalItems, null, 2)}

SURPLUS FACILITIES (Stock > 45 days):
${JSON.stringify(surplusItems, null, 2)}

PROJECTED DEMAND DEFICITS (30-day forecasts):
${JSON.stringify(activeForecasts, null, 2)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                headline: { type: 'STRING' },
                summary: { type: 'STRING' },
                priorityAlerts: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      facility: { type: 'STRING' },
                      district: { type: 'STRING' },
                      medicine: { type: 'STRING' },
                      daysRemaining: { type: 'NUMBER' },
                      riskLevel: {
                        type: 'STRING',
                        enum: ['CRITICAL', 'HIGH']
                      },
                      urgencyReason: { type: 'STRING' }
                    },
                    required: [
                      'facility',
                      'district',
                      'medicine',
                      'daysRemaining',
                      'riskLevel',
                      'urgencyReason'
                    ]
                  }
                },
                redistributionStrategies: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      action: { type: 'STRING' },
                      fromFacility: { type: 'STRING' },
                      toFacility: { type: 'STRING' },
                      medicine: { type: 'STRING' },
                      units: { type: 'NUMBER' },
                      expectedImpact: { type: 'STRING' },
                      spoilageMitigation: { type: 'STRING' }
                    },
                    required: [
                      'action',
                      'fromFacility',
                      'toFacility',
                      'medicine',
                      'units',
                      'expectedImpact',
                      'spoilageMitigation'
                    ]
                  }
                },
                procurementRecommendations: {
                  type: 'ARRAY',
                  items: { type: 'STRING' }
                }
              },
              required: [
                'headline',
                'summary',
                'priorityAlerts',
                'redistributionStrategies',
                'procurementRecommendations'
              ]
            }
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Gemini API error ${response.status}:`,
          errorBody
        );

        return NextResponse.json({
          ...deterministicAdvisory,
          label: 'Demo data — synthetic district/facility supply data',
        });
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty Gemini response');

      const cleanedText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      let parsed;

      try {
        parsed = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Gemini JSON parse error:', parseError);
        throw parseError;
      }

      return NextResponse.json({
        ...parsed,
        source: 'gemini',
        generatedAt: new Date().toISOString(),
        disclaimer: 'Prototype Demonstration: Recommendations generated by Gemini AI using synthetic district/facility supply data.',
        label: 'Demo data — synthetic district/facility supply data',
      });
    } catch (aiErr) {
      console.warn('Gemini AI advisory error, falling back to deterministic:', aiErr);
      return NextResponse.json({
        ...deterministicAdvisory,
        label: 'Demo data — synthetic district/facility supply data',
      });
    }
  } catch (error: any) {
    console.error('API /api/health-system/ai-advisory error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI supply advisory' },
      { status: 500 }
    );
  }
}
