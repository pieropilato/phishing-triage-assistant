# Product Requirements Document - Phishing Triage Assistant

**Owner:** Piero Pilato | **Version:** 1.0 (MVP) | **Date:** November 2026
## 1. Problem statement

Small IT teams spend up to 30 minutes checking each email staff report as suspicious (Microsoft,
2026). Most are harmless, quality varies by analyst, and enterprise automation is out of budget.

## 2. Target users

- **Primary:** IT administrator / Tier-1 analyst in a 50-500 person organisation with no SOC tooling.
- **Secondary:** experienced analyst who wants a second opinion and a ticket note.

## 3. Core features and acceptance criteria

| # | Feature | Acceptance criteria (pass / fail) |
|---|---|---|
| F1 | Verdict | One of phishing / suspicious / spam / legitimate with confidence 0-100, in under 15 s. |
| F2 | Explanation | Summary, 1-6 reasons, and rule findings marked high / medium / low. |
| F3 | Indicators | URLs, domains, IPs, emails, hashes listed once, always defanged. |
| F4 | Header checks | SPF / DKIM / DMARC shown; Reply-To or Return-Path domain different from From is flagged. |
| F5 | Guardrail | 1+ high-severity finding -> never "legitimate". Prompt-injection text -> at least "suspicious". |
| F6 | Ticket output | One click copies a ticket note; another copies a reply to the reporter. |
| F7 | Bad input | Under 20 / over 20,000 characters or non-JSON -> HTTP 400; 11th request per minute per IP -> 429. |
| F8 | No-AI fallback | AI error or no key -> rules-only verdict, labelled on screen. |

## 4. Out of scope (v1)

Mailbox integration, link or attachment detonation, reputation lookups, accounts, storing emails,
automatic blocking, non-English rule checks.

## 5. Success metrics

- **Speed:** verdict in under 15 s, vs. up to 30 min by hand (server log `ms`).
- **Quality:** 9 of 10 test emails correct; no phishing sample ever labelled legitimate.
- **Usefulness:** 50%+ of analyses followed by a copy action (Vercel Analytics).
- **Reliability and cost:** under 2% AI fallbacks; under USD 0.01 per email.

## 6. Open questions

1. Is pasting company email into a third-party AI acceptable? Is redaction enough?
2. How much would URL reputation data improve accuracy?
3. How well does it handle non-English phishing?
