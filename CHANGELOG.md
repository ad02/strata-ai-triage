# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Bootstrap: Next.js 16.2.6 (App Router) + React 19.2 + TypeScript 5 + Tailwind v4
- Bootstrap: shadcn/ui with 12 components (badge, button, card, dialog, input, label, scroll-area, separator, skeleton, sonner, textarea, tooltip)
- Bootstrap: Runtime deps `@google/genai` v2.0.1 (Gemini), `zod` v4 (schema validation), `zustand` v5 (state)
- Bootstrap: Vitest v4 for unit tests; npm scripts `test` and `test:watch`
- Bootstrap: `.env.example` documenting required `GEMINI_API_KEY`
- Bootstrap: `vitest.config.ts` with `@/*` import alias matching tsconfig

### Notes
- Next.js 16 (released ahead of original Next.js 15 plan) — Turbopack is now default; `next lint` removed in favor of direct `eslint` invocation. No code changes needed for our use case.
- Replaces a prior wrong-domain prototype (generic strata management) — the new build is tailored to **Strata Business Brokers**, an Australian M&A brokerage. See git history (`git log --all`) for prior work.
