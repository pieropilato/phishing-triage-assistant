# Product Requirements Document - Phishing Triage Assistant

**Owner:** Piero Pilato | **Version:** 1.0 (MVP) | **Date:** November 2026

## 1. Problem statement

IT generalists and junior analysts in small and mid-size organisations spend up to 30 minutes
checking each email that staff report as suspicious. Most reports are harmless, the check depends on
personal experience, and enterprise automation is out of budget. Real phishing waits while time goes
to noise.

## 2. Target users

- **Primary:** IT administrator / Tier-1 analyst in a 50-500 person organisation with no dedicated
  SOC tooling. Needs a fast, defensible first answer and a note for the ticket.
- **Secondary:** experienced analyst who wants a second opinion and a ready-made handover note.

## 3. Core features and acceptance criteria

| # | Feature | Acceptance criteria (pass / fail) |
|---|---|---|
| F1 | Paste an email and get a verdict | Given 20-20,000 characters of text, the app returns exactly one of `phishing`, `suspicious`, `spam`, `legitimate` with a confidence of 0-100, in under 15 seconds. |
| F2 | Explain the verdict | Every result shows a summary and 1-6 reasons. Rule findings are listed with a severity of high, medium or low. |
| F3 | Extract indicators | URLs, domains, IPv4 addresses, email addresses and file hashes in the text are listed, de-duplicated, and always shown defanged (e.g. `hxxps[://]evil[.]com`). |
| F4 | Check headers | When headers are pasted, the app shows SPF, DKIM and DMARC results and flags a Reply-To or Return-Path domain that differs from the From domain. |
| F5 | Guardrail | If at least one high-severity rule finding exists, the final verdict is never `legitimate`. If the email contains text that tries to instruct the AI, the verdict is at least `suspicious`. |
| F6 | Ticket-ready output | One click copies a plain-text note with verdict, reasons, findings, defanged indicators and actions. A second button copies a short reply for the reporter. |
| F7 | Safe handling of bad input | Empty, too short, too long or non-JSON input returns HTTP 400 with a clear message. More than 10 requests per minute from one IP returns HTTP 429. |
| F8 | Works without the AI | If the AI provider fails or no key is set, the app still returns a rules-only verdict and says so on screen. |

## 4. Out of scope (v1)

- Connecting to a mailbox (Microsoft Graph, Gmail) or a "report phishing" button
- Opening, scanning or detonating links and attachments
- URL / domain reputation lookups
- User accounts, history or storage of submitted emails
- Automatic blocking or email removal
- Languages other than English in the rule checks
- Payments

## 5. Success metrics

| Metric | Target | How measured |
|---|---|---|
| Time to verdict | Under 15 seconds (vs. up to 30 minutes by hand) | `ms` field in server logs |
| Verdict quality | At least 9 of 10 test emails classified correctly; no phishing sample labelled `legitimate` | Manual test set + unit tests |
| Useful output | At least 50% of analyses followed by a "copy" action | Vercel Analytics custom events |
| Reliability | Under 2% of requests fall back to rules-only because of AI errors | `aiUsed` / `aiError` in logs |
| Cost | Under USD 0.01 per analysed email | Provider usage dashboard |

## 6. Open questions

1. Is pasting company email into a third-party AI acceptable under typical data policies? Would
   automatic redaction of names and addresses be enough?
2. How much would URL reputation data improve accuracy, and which free source is reliable enough?
3. Should the tool keep an anonymous history so repeat campaigns can be recognised?
4. How well does it handle non-English phishing?
5. What is the right confidence threshold for telling a user "safe" without analyst review?
