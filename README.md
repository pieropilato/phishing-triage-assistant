# Phishing Triage Assistant

Paste a suspicious email. Get a verdict, the red flags behind it, defanged indicators and a
ticket-ready note in seconds.

**Live app:** https://phishing-triage-assistant-vrnz-ruby.vercel.app
**CI:** ![CI](https://github.com/pieropilato/phishing-triage-assistant/actions/workflows/ci.yml/badge.svg)

## The problem

IT generalists and junior analysts in small and mid-size organisations can spend up to 30 minutes
checking each email that staff report as suspicious. Most reports are harmless, the quality of the
check depends on who is on shift, and enterprise phishing automation is out of budget.

## What it does

- **Verdict:** phishing, suspicious, spam or legitimate, with a confidence score
- **Evidence:** 20 rule checks (failed DMARC, Reply-To mismatch, look-alike domains, raw-IP links,
  link text that hides the real target, credential and payment requests, and more)
- **AI reasoning:** a language model explains the verdict in plain language and suggests actions
- **Guardrail:** the AI cannot label an email "legitimate" when hard red flags exist, and text in the
  email that tries to instruct the AI is itself flagged
- **Indicators:** URLs, domains, IPs, email addresses and hashes, extracted by code and defanged
- **Handover:** copy a ticket note, the indicator list, or a short reply to the reporter
- **Resilient:** if the AI provider is down, you still get a rules-only verdict

It never opens links, and it stores nothing.

## How it works

```
Browser  ->  POST /api/triage  ->  validate + rate limit
                                   parse headers, extract indicators
                                   rule checks (evidence)
                                   AI classification (JSON, schema-checked)
                                   guardrail (can only raise the verdict)
         <-  result JSON
```

More detail: [architecture notes](docs/03-architecture.md) and [spec.md](spec.md).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| AI | Vercel AI SDK with Anthropic (`claude-haiku-5-5`); OpenAI and OpenRouter also supported |
| Validation | zod |
| Tests | vitest (40 unit tests, AI mocked) |
| CI/CD | GitHub Actions (secret scan, lint, typecheck, tests, build); Vercel deploys `main` |
| Monitoring | Vercel Analytics events and structured server logs |

## Run it locally

Requires Node.js 22 or later.

```bash
git clone https://github.com/pieropilato/phishing-triage-assistant.git
cd phishing-triage-assistant
npm ci
cp .env.example .env.local   # then add your key to .env.local
npm run dev
```

Open http://localhost:3000. Without a key the app runs in rules-only mode.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `AI_PROVIDER` | No | `anthropic` (default), `openai` or `openrouter` |
| `AI_API_KEY` | Yes, for AI analysis | API key for the provider |
| `AI_MODEL` | No | Overrides the default model |

Keys are read on the server only. Never commit `.env.local`; it is ignored by git. In production the
key is set in Vercel under Project Settings -> Environment Variables.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests |
| `npm run build` | Production build |

## API

`POST /api/triage`

```bash
curl -X POST https://phishing-triage-assistant-vrnz-ruby.vercel.app/api/triage \
  -H "Content-Type: application/json" \
  -d '{"email":"From: IT Support <it@example.com>\nSubject: Verify your account\n\nPlease verify your account within 24 hours."}'
```

Returns the verdict, confidence, reasons, rule findings, defanged indicators and actions. Limits:
20-20,000 characters, 10 requests per minute per IP. Full contract in [spec.md](spec.md).

`GET /api/triage` is a health check.

## Testing

```bash
npm test
```

Tests cover indicator extraction and defanging, header parsing, every key rule, the guardrail, input
validation, model-output parsing, the retry and fallback paths, prompt-injection handling and the
rate limiter. The model is mocked, so tests need no API key.

## CI/CD

Every push and pull request to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
clean install (`npm ci`), secret scan, lint, typecheck, unit tests and build. Vercel deploys `main`
to production and creates a preview for each pull request.

## Security and privacy

- No secrets in the repository; CI fails if something that looks like a key is committed
- Input validated and size-limited; per-IP rate limiting
- Email content is treated as untrusted data in the prompt, rendered as text only, and never logged
- Links are never opened or resolved
- Nothing is stored. The pasted text is sent to the configured AI provider to produce the analysis,
  so follow your organisation's data policy before pasting real email

## Limitations

- First-pass decision support, not a sandbox or an automatic block
- No URL or attachment reputation data yet (see the open v2 issue)
- Rule wording checks are English only

## Project documents

| Document | Link |
|---|---|
| Idea validation report (7 steps) | [docs/01-idea-validation.md](docs/01-idea-validation.md) |
| PRD | [docs/02-prd.md](docs/02-prd.md) |
| Architecture notes | [docs/03-architecture.md](docs/03-architecture.md) |
| Spec | [spec.md](spec.md) |
| Reflection | [docs/04-reflection.md](docs/04-reflection.md) |
| Demo script | [docs/05-demo-script.md](docs/05-demo-script.md) |
| AI coding context | [CLAUDE.md](CLAUDE.md), [agents.md](agents.md), [.cursorrules](.cursorrules) |

## Author

Piero Pilato - Week 4 Graded Mini Project 4.2, Postgraduate Certificate in Generative AI and Agentic AI.
