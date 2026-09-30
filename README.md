# PranCare — Protect the Life That Matters Most

> **AI-Assisted Medicine Packaging Verification, Family Adherence Shield, SafeMix Interaction Radar & Smart Public Health Supply Operations**  
> Designed for Indian citizens, elderly patients, caregivers, and public health supply officers.

[![Tests Passing](https://img.shields.io/badge/Tests-21%2F21%20Passing-brightgreen)]()
[![Privacy](https://img.shields.io/badge/Privacy-k--Anonymity%20(k%3D5)-blue)]()
[![i18n](https://img.shields.io/badge/Languages-6%20Indian%20Languages-teal)]()
[![Framework](https://img.shields.io/badge/Framework-Next.js%2014-black)]()

---

## 1. Project Overview

**PranCare** is a unified dual-sided digital healthcare platform:
1. **Citizen Safety Shield**: An elderly-friendly, multilingual portal for verifying printed medicine packaging attributes, detecting dangerous herb-drug/drug-drug interactions, managing chronic family prescriptions, and inspecting anonymized community safety trends.
2. **Smart Health System & Supply Operations**: A multi-tier public health inventory and redistribution network that provides real-time district-level visibility, 30-day demand forecasting, automated surplus-to-deficit rebalancing, and Gemini AI-powered operational supply advisories.

---

## 2. Core Features

### 👨‍👩‍👧‍👦 Citizen Portal Features
- **Packaging Verification Engine (`/scan`)**: Extracts medicine imprint text, batch numbers, manufacturer details, and GS1 barcodes via OCR/Gemini Vision, running them through deterministic safety checks (C1–C8) against registered formulations and recall registries.
- **SafeMix Interaction Shield (`/safemix`)**: Detects dangerous drug-drug and Ayurvedic herb-drug interactions (e.g., Aspirin + Ashwagandha bleeding risks) and generates doctor-ready consultation prompts.
- **Family Adherence & Dose Reminders (`/family`)**: Caregiver dashboard with pill counts, low-stock notifications, dose tracking, and voice-assisted audio nudges.
- **Medicine Safety Map (`/map`)**: Interactive regional public health radar mapping verification activity across Indian districts while enforcing strict **$k$-anonymity ($k \ge 5$)** to guarantee individual privacy.
- **Doctor Connect (`/doctor-connect`)**: Quick access to verified telehealth services and consultation resources.
- **Multilingual Support**: Available in English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), and Marathi (मराठी), with Web Speech API audio synthesis.

### 🏥 Health System & Supply Operations Features (`/health-system`)
- **Multi-Tier Inventory Visibility (`/health-system/inventory`)**: Real-time stock levels, daily burn rates, batch expiries, and days-of-supply tracking across Primary Health Centres (PHCs), Community Health Centres (CHCs), Sub-Divisional Hospitals (SDHs), and District Warehouses.
- **30-Day Predictive Forecasting (`/health-system/forecasts`)**: Moving-average consumption velocity modeling with seasonal monsoon surge signals and buffer-breach alerting.
- **Cross-Facility Redistribution Engine (`/health-system/redistribution`)**: Distance-aware matching algorithm pairing surplus depots with deficit rural clinics (e.g., matching near-expiry batches to high-velocity clinics to prevent spoilage).
- **Gemini AI Supply Advisory (`/health-system`)**: Generates structured executive briefings with priority stockout hazards, rebalancing actions, and procurement guidance. Includes a deterministic algorithmic fallback if the AI key is offline.
- **Facility Directory (`/health-system/facilities`)**: District-level facility registry with cold-chain readiness and storage capacities.

---

## 3. Technology Stack

- **Framework**: Next.js 14 (App Router) + TypeScript + React 18
- **Styling**: Tailwind CSS + Custom Design System Tokens (`design-tokens.json`)
- **Database**: SQLite via `better-sqlite3` (auto-seeded on startup, `/tmp/prancare.db` fallback on serverless)
- **Mapping**: Leaflet + OpenStreetMap (no external API keys required)
- **AI Intelligence**: Google Gemini API (`@google/genai` / Google Gen AI SDK) with structured JSON schemas and robust deterministic fallbacks
- **Testing**: Vitest (21 unit and integration tests covering verification rules, redistribution algorithms, privacy guarantees, and API endpoints)

---

## 4. Local Setup & Installation

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or later

### Step-by-Step Setup

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repository-url>
   cd prancare
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` to specify your Gemini API key (optional for demo flows):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   DEMO_MODE=false
   ```
   > *Note: If `GEMINI_API_KEY` is omitted or unavailable, PranCare seamlessly falls back to its built-in deterministic verification and advisory engine.*

3. **Run the Project**:
   ```bash
   # Start the local development server
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Tests & Type Checking**:
   ```bash
   # Run Vitest test suite
   npm test

   # Run TypeScript typecheck
   npx tsc --noEmit

   # Create production build
   npm run build
   ```

---

## 5. Sample & Demo Data Notice

> **Note on Data**: The healthcare facilities, stock levels, consumption records, and patient scenarios bundled in this application are synthetic demo/sample data designed for prototyping and evaluation. In a production deployment, these models connect to certified national registries (e.g., ONDC, CDSCO, e-Aushadhi).

---

## 6. Deployment Instructions (Vercel)

PranCare is pre-configured for seamless deployment to [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the project into the Vercel Dashboard.
3. Configure the following Environment Variables in Vercel Project Settings:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `GEMINI_MODEL`: `gemini-1.5-flash` (or `gemini-1.5-pro`)
4. Deploy. The SQLite database will automatically initialize and seed in the serverless temporary directory (`/tmp/prancare.db`).

---

## 7. Ethical Principles & Non-Negotiables

- **Deterministic Verification Verdicts**: AI extracts packaging traits from imagery; final verification statuses (`VERIFIED`, `NEEDS_VERIFICATION`, `SUSPICIOUS`) are strictly evaluated by deterministic business rules (C1–C8).
- **Objective Claims**: PranCare does not make arbitrary authenticity claims; it evaluates match fidelity against official drug registries and active batch recalls.
- **Privacy Enforcement**: Raw GPS coordinates are never stored or exposed; community map data enforces mathematical $k$-anonymity ($k \ge 5$).
- **Accessible Design**: High-contrast typography, dual-channel visual indicators (never color alone), and multi-lingual voice synthesis.
