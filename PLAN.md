# PranCare Implementation Plan (PLAN.md)

**Product Name:** PranCare  
**Tagline:** *Protect the Life That Matters Most*  
**Core Purpose:** Scan medicine packaging → extract printed text via Gemini Vision → compare deterministically against trusted/public catalog & recall databases → surface matches, mismatches & warnings → explain in simple language → provide next actions.

---

## 1. Chosen Tech Stack

- **Framework**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS (configured with `design-tokens.json`)
- **PWA & Offline**: Web App Manifest, Service Worker, and client-side IndexedDB sync queue
- **Database**: SQLite with clean schema & migrations (portable to PostgreSQL)
- **AI Vision & Explainer**: Google Gemini SDK (`@google/genai` or `@google/generative-ai`) isolated in `src/lib/gemini.ts`
- **Validation**: Zod for all API contracts, Gemini structured JSON responses, and form inputs
- **Mapping & Geocoding**: Leaflet + OpenStreetMap tiles with hex/cell aggregation & k-anonymity (k=5)
- **i18n**: JSON-based dictionary localization for 6 Indian languages (English, Hindi, Bengali, Tamil, Telugu, Marathi)
- **Accessibility & Audio**: Web Speech API (`speechSynthesis`) for multilingual voice read-aloud
- **Testing**: Vitest for deterministic classification, normalization, and safety rules

---

## 2. Folder Structure

```
prancare/
├── assets/
│   └── reference/          # logo.png, mockup.png, pitch.pdf
├── content/
│   └── citations.json      # Grounded source references for claims
├── design-tokens.json      # Extracted mockup styling tokens
├── public/
│   ├── demo/               # Fictional demo pack images (Pass, Needs Review, Suspicious, Expired)
│   ├── logo.png            # Official PranCare branding
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker for offline shell & sync
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Elder-Friendly Daily Dashboard (Left Phone mockup)
│   │   ├── scan/           # Camera, upload, quality guide, multi-side capture
│   │   ├── result/[id]/    # 3-question result card, evidence, audio read-aloud
│   │   ├── safemix/        # Allopathic + Ayurvedic interaction shield (Center Phone mockup)
│   │   ├── family/         # Real-time Family Care Monitor (Right Phone mockup)
│   │   ├── map/            # Medicine Safety Map (privacy-first k-anonymity heatmap)
│   │   ├── report/[id]/    # Shareable & printable safety report
│   │   ├── doctor-connect/ # Prototype Doctor Connect with attached report
│   │   ├── privacy/        # Privacy policy & opt-in disclosures
│   │   └── api/
│   │       ├── extract/    # Gemini Vision structured OCR
│   │       ├── verify/     # Deterministic verification engine
│   │       ├── safemix/    # Drug-drug / herb-drug interaction check
│   │       ├── map/        # Geo-aggregated scan events with k-anonymity
│   │       └── sync/       # Offline queue synchronization
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── VoiceButton.tsx
│   │   ├── TextSizeToggle.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── DemoSelector.tsx
│   ├── lib/
│   │   ├── db.ts           # SQLite repository
│   │   ├── gemini.ts       # Isolated Gemini API client + schema validation
│   │   ├── normalize.ts    # String, strength, ingredient & date normalization
│   │   ├── classify.ts     # Pure deterministic classification engine (C1-C8)
│   │   ├── adapters/       # Modular sources (DemoCatalog, DemoRecall, GS1, RealStub)
│   │   ├── safemix.ts      # Interaction analyzer & demo database
│   │   ├── geo.ts          # Privacy-preserving cell hasher & k-anonymity filter
│   │   └── i18n/           # Translation dictionaries & language registry
│   └── types/
│       └── index.ts        # Shared Zod schemas & TypeScript types
├── tests/
│   ├── classify.test.ts    # Deterministic verification & edge-case rules
│   ├── normalize.test.ts   # Normalization unit tests
│   └── privacy.test.ts     # k-anonymity & no-raw-coords leakage tests
├── DECISIONS.md
├── PLAN.md
├── README.md
└── .env.example
```

---

## 3. Data Model

```prisma
model User {
  id                String   @id @default(uuid())
  name              String
  language          String   @default("en")
  phone_or_email    String?
  role              String   @default("patient") // patient | caregiver
  text_size         String   @default("normal")  // normal | large | extraLarge
  share_location    Boolean  @default(false)     // opt-in for anonymous safety map
  created_at        DateTime @default(now())
}

model MedicineScan {
  id                  String   @id @default(uuid())
  user_id             String?
  image_refs          String   // JSON array of image URLs
  medicine_name       String?
  brand_name          String?
  active_ingredients  String?  // JSON array
  manufacturer        String?
  batch_number        String?
  manufacturing_date  String?
  expiry_date         String?
  barcode             String?
  extraction_raw      String   // Full validated Gemini JSON
  created_at          DateTime @default(now())
}

model Verification {
  id             String   @id @default(uuid())
  scan_id        String   @unique
  status         String   // VERIFIED | NEEDS_VERIFICATION | SUSPICIOUS
  primary_reason String
  confidence     String   // LOW | MEDIUM | HIGH
  checks_json    String   // Detailed checks array C1-C8
  sources_json   String   // External source evidence with timestamps
  is_demo        Boolean  @default(false)
  created_at     DateTime @default(now())
}

model FamilyMember {
  id             String   @id @default(uuid())
  name           String   // e.g. "Dadi", "Dada"
  relation       String
  avatar         String
  next_dose_time String
  medicine_name  String
  status         String   // taken | missed | pending
  stock_count    Int
  refill_status  String   // ok | low | scheduled
}

model AggregateEvent {
  id                String   @id @default(uuid())
  geo_cell          String   // Coarse district / grid cell (NO user ID, NO raw lat/lng)
  week              String   // YYYY-WW time bucket
  medicine_norm     String
  manufacturer_norm String
  status            String   // VERIFIED | NEEDS_VERIFICATION | SUSPICIOUS
  reason            String
  is_synthetic      Boolean  @default(false)
}
```

---

## 4. API Contract

### `POST /api/extract`
- **Input**: `{ images: string[] }` (Base64 or URL)
- **Output**: Validated `GeminiExtraction` object with confidence ratings and null for unread fields.

### `POST /api/verify`
- **Input**: `{ extraction: GeminiExtraction, scanId?: string, contributeAnonymous?: boolean, coarseLocation?: { lat: number, lng: number } }`
- **Output**: `VerificationResult` containing:
  - `status`: `"VERIFIED"` | `"NEEDS_VERIFICATION"` | `"SUSPICIOUS"`
  - `confidence`: `"LOW"` | `"MEDIUM"` | `"HIGH"`
  - `checks`: Array of C1–C8 check results with source attribution and demo flags
  - `detected`: Detected fields from photo
  - `verified`: Source-backed verified fields with timestamps
  - `unverified`: Fields that could not be independently confirmed
  - `threeQuestions`: Simple summary ("What did we find?", "What did we verify?", "What should you do next?")
  - `plainExplanation`: Grade-6 plain language summary localized in user's language

### `POST /api/safemix`
- **Input**: `{ medicines: string[] }` (e.g. `["Aspirin", "Ashwagandha"]`)
- **Output**: `{ pairs: Array<{ pair: [string, string], severity: string, plainExplanation: string, whatToAskDoctor: string }>, disclaimer: string }`

### `GET /api/map`
- **Input**: Query params `?medicine=&status=&timeframe=`
- **Output**: Aggregated cell events filtered by k-anonymity (min 5 scans per cell).

---

## 5. Build Phases (Section 20)

- [ ] **Phase A: Foundation** (Repo, design tokens, layout, navigation, splash, i18n scaffold, PWA shell, DB & seeds)
- [ ] **Phase B: Scan + Extract** (Camera/upload, quality guidance, multi-image, Gemini extraction w/ Zod, extraction preview)
- [ ] **Phase C: Verify Engine** (Adapters, normalization, deterministic checks C1-C8, classification rules, unit tests)
- [ ] **Phase D: Result UX** (3-question block, Detected vs Verified, plain explanation, audio read-aloud, share report)
- [ ] **Phase E: Medicine Safety Map** (Privacy-preserving aggregation, k-anonymity, Leaflet map, filters, summary cards)
- [ ] **Phase F: Multilingual & Elderly-First** (6 languages, font support, TTS locales, text scaling)
- [ ] **Phase G: Secondary Modules** (Family dashboard, reminders, SafeMix interaction shield, Doctor Connect mock)
- [ ] **Phase H: Polish & QA** (Offline queue, a11y, demo scenarios, tests, README documentation)
