# DECISIONS.md — Architecture & Assumptions Log

1. **Tech Stack Choice**: Next.js App Router (14/15) with TypeScript, Tailwind CSS, and SQLite for maximum portability, fast dev-server iteration, and zero external database setup.
2. **Deterministic Verification Engine**: Classification (Verified / Needs Verification / Suspicious) strictly executed via pure TypeScript rules in `lib/classify.ts`, never determined by LLM.
3. **Gemini Integration Layer**: Google Gemini API invoked server-side only in `lib/gemini.ts` with strict JSON mode, validated with Zod, and falling back gracefully to pre-recorded demo extractions when offline or keys absent.
4. **Separation of Detected vs Verified**: Detected features reflect OCR vision output; verified fields reflect verifiable catalog/recall adapter hits with timestamps and DEMO DATA badges.
5. **Medicine Authenticity Wording**: Never assert physical medicine is "genuine" or "fake"; use neutral terminology ("matches registered records", "unverified batch", "regulatory alert match").
6. **Privacy-First Geolocation**: Client coordinates immediately mapped to coarse geographic cells on server; raw lat/lng never persisted with user identity; k-anonymity (k=5) strictly enforced.
7. **Elderly-First Accessibility**: Base body font ≥ 18px, primary touch targets ≥ 56px, high-contrast badges, dual-channel status indicators (icon + text), and Web Speech API read-aloud.
8. **Demo Mode Default**: `DEMO_MODE=true` seeds synthetic India-wide map data, sample fictional blister pack images, and mock responses so judges can evaluate all 3 states offline without API keys.
9. **Multilingual Safety Strings**: Support English, Hindi, Bengali, Tamil, Telugu, and Marathi with localized strings; note that production medical deployment requires native clinical translation review.
10. **Doctor Connect & Refill Scope**: Doctor Connect provides a labeled prototype simulation with attached safety reports; auto-refill triggers explicit mock alerts rather than external pharmacy orders.
