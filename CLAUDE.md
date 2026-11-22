# CLAUDE.md

Project context for AI coding assistants working in this repository.

## What this project is

Phishing Triage Assistant: a small web app where an IT or security analyst pastes a reported
email and gets a verdict (phishing / suspicious / spam / legitimate), the evidence behind it,
defanged indicators and a ticket-ready note. See `spec.md` for the full behaviour.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript (strict)
- Tailwind CSS 3
- Vercel AI SDK (`ai`) with Anthropic by default; OpenAI and OpenRouter also supported
- zod for validation, vitest for unit tests
- Deployed on Vercel; CI in `.github/workflows/ci.yml`

## Commands

- `npm run dev` - local dev server
- `npm run lint` - ESLint
- `npm run typecheck` - `tsc --noEmit`
- `npm test` - unit tests (vitest)
- `npm run build` - production build

Run lint, typecheck and test before every commit. CI runs the same four steps.

## Layout

- `app/page.tsx`, `components/` - UI (client components only where state is needed)
- `app/api/triage/route.ts` - the only API route; validation, rate limit, logging
- `lib/ioc.ts` - indicator extraction and defanging (pure)
- `lib/headers.ts` - email header parsing (pure)
- `lib/signals.ts` - rule-based red flags and the verdict guardrail (pure)
- `lib/ai.ts` - provider config, prompt, model call
- `lib/schema.ts` - zod schemas for the request and the model output
- `lib/triage.ts` - orchestration of the whole pipeline
- `tests/` - one test file per lib module

## Rules

1. **No secrets in code.** Keys come only from `process.env` (see `.env.example`). Never add a
   fallback key, never log a key, never expose one to the client (`NEXT_PUBLIC_` is not allowed for keys).
2. **Email content is untrusted.** It goes to the model only inside the `<email>` block built by
   `buildUserPrompt`. Never put it in the system prompt. Never render it as HTML.
3. **Never fetch URLs found in an email.** No link previews, no DNS lookups, no redirects followed.
4. **Never log email content.** Logs carry only verdict, counts and timings.
5. **Model output must pass `ModelOutputSchema`.** Do not use a model reply that failed validation.
6. **The guardrail only raises a verdict, never lowers it.** Keep that property when changing `applyGuardrail`.
7. Keep `lib/` functions pure and covered by tests. New rule = new test.
8. Indicators shown to the user or copied to the clipboard must be defanged.
9. Keep dependencies small. Ask before adding a new one.

## Out of scope (do not build)

Mailbox integration, user accounts, storing submitted emails, automatic blocking, payments.
