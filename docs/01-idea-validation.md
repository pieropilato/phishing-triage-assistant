# Idea Validation Report

**Project:** Phishing Triage Assistant
**Author:** Piero Pilato
**Date:** November 2026

This report follows the seven validation steps from Week 4.

---

## Step 1 - Rough problem statement

> "People in IT get a lot of suspicious emails forwarded to them and it takes too long to check each one."

This was my starting point. It is true, but it is vague: it does not say who exactly, how long, or why
existing tools do not solve it.

## Step 2 - Problem statement refined with AI

I asked an AI assistant to challenge the rough statement with three questions: *who has this problem
most, what does it cost them, and what do they do today?* After two rounds the statement became:

> **IT generalists and junior analysts in small and mid-size organisations, who have no dedicated SOC
> tooling, spend up to 30 minutes manually checking each email that staff report as suspicious. Most
> of those reports turn out to be harmless, so real phishing waits in the queue while time is spent
> on noise, and the quality of the check depends on who is on shift.**

What changed: the user is now specific, the cost is measurable (minutes per email), and the real pain
is *inconsistent, slow first-pass triage*, not email volume in general.

## Step 3 - Target user

**Primary user: "Sam", IT administrator / Tier-1 analyst**

| | |
|---|---|
| Organisation | 50-500 staff, Microsoft 365 or Google Workspace, basic email filtering |
| Team | 1-5 IT people; security is a part-time duty |
| Trigger | A colleague forwards an email with "is this safe?" |
| Today | Opens headers by hand, hovers over links, pastes URLs into free scanners, writes a ticket note |
| Skill gap | Knows the basics, but is not confident reading SPF/DKIM/DMARC or spotting look-alike domains |
| Goal | A fast, defensible answer and a clean note for the ticket |

**Secondary user:** an experienced analyst who wants a quick second opinion and a ready-made ticket note.

**Not the user:** large enterprises with an automated phishing pipeline, or end users checking their own mail.

## Step 4 - Alternatives and competitors

| Alternative | What it does well | Where it falls short for Sam |
|---|---|---|
| Manual check (headers + link hovering) | Free, no setup | Slow, error-prone, depends on experience |
| Free scanners (VirusTotal, urlscan.io) | Good reputation data for a URL or file | Checks one indicator at a time; says nothing about wording, pretext or BEC with no links |
| Microsoft Security Copilot Phishing Triage Agent | Automated, integrated in Defender | Needs Defender for Office 365 Plan 2 plus Security Copilot capacity; only for Microsoft tenants |
| Abnormal AI, Proofpoint, Cofense | Enterprise-grade automation and remediation | Enterprise pricing and onboarding; out of reach for a small IT team |
| General chatbots (ChatGPT etc.) | Flexible, already available | No structure, no indicator extraction, no guardrails; easy to fool with text inside the email; result differs every time |

## Step 5 - The unmet gap (differentiating angle)

**There is no zero-setup, explainable first-pass triage for teams that cannot buy or deploy an
enterprise email security platform.**

My angle:

1. **Paste and go.** No tenant integration, no licence, no agent to deploy.
2. **Evidence, not just a label.** Rule checks (header mismatches, look-alike domains, raw-IP links,
   failed DMARC) are shown next to the AI reasoning, so the analyst can verify the verdict.
3. **Guardrail against a fooled model.** The AI cannot label an email "legitimate" when hard red flags
   exist, and text in the email that tries to instruct the AI is itself flagged.
4. **Output fits the workflow.** Defanged indicators and a ticket-ready note, plus a short reply for
   the person who reported the email.

## Step 6 - Stress test (sceptical engineer's view)

| Challenge | Answer |
|---|---|
| "It's just a chatbot wrapper." | The verdict combines deterministic checks with the model. The app still returns a rules-only verdict if the model is down, and the guardrail overrides the model when evidence is strong. |
| "The email can tell the model what to say." | Email text is passed as data inside a delimited block, the system prompt tells the model to ignore instructions in it, a rule detects injection phrases, and the guardrail then forces at least "suspicious". Covered by unit tests. |
| "LLMs hallucinate indicators." | Indicators are extracted by code, never by the model. The model only explains and classifies. |
| "Pasting company email into an AI is a privacy risk." | Nothing is stored or logged by the app. The limitation is stated on the page. A v2 item is redaction of personal data before the AI call. |
| "Without link detonation it will miss things." | True. This is first-pass triage, not a sandbox. The app never opens links (a safety choice) and says so. URL reputation lookup is the planned v2 improvement. |
| "False negatives are dangerous." | The tool is decision support. It shows confidence, and the guardrail is designed to fail towards "suspicious" rather than "legitimate". |
| "Someone will abuse the public endpoint." | Input size limits, per-IP rate limiting, and the key stays on the server. |

## Step 7 - Reflection: did the idea change?

Yes, in three ways:

- **From "detector" to "triage assistant".** I first pictured a phishing detector. Validation showed
  that detection products already exist; what small teams lack is a quick, explainable first pass and
  a clean handover note.
- **Rules became part of the product.** The stress test made it clear that a model alone can be
  talked out of the right answer. Adding deterministic checks and a guardrail was a direct result.
- **Scope got smaller.** Mailbox integration, reputation lookups and storage moved to "later". The
  MVP is one screen that does one job well.

---

## Evidence

### Why this problem is real

- Phishing was the most reported crime to the FBI's IC3 in 2024 with 193,407 complaints, and business
  email compromise caused about USD 2.77 billion in reported losses.
  ([Nacha summary of the IC3 2024 report](https://www.nacha.org/news/fbis-ic3-finds-almost-85-billion-lost-business-email-compromise-last-three-years))
- APWG counted about 3.8 million phishing attacks in 2025, slightly up from 3.76 million in 2024.
  ([APWG Q4 2025 report](https://docs.apwg.org/reports/apwg_trends_report_q4_2025.pdf))
- The human element was present in 62% of breaches in the 2026 Verizon DBIR, and phishing was the
  initial access vector in 16% of breaches.
  ([Mimecast on DBIR 2026](https://mimecast.com/blog/2026-verizon-dbir-findings/),
  [SC World on DBIR 2026](https://www.scworld.com/news/verizon-dbir-2026-vulnerability-exploits-top-initial-access-as-patching-coverage-falls))

### Why triage itself is the bottleneck

- Around 88% of emails reported by users are not malicious, and manual triage of one reported email
  can take up to 30 minutes of analyst time.
  ([Abnormal AI, citing Microsoft](https://abnormal.ai/blog/user-reported-phishing-response-ai))
- Microsoft describes SOC teams as overwhelmed by the volume of user-reported emails.
  ([Microsoft Security blog](https://techcommunity.microsoft.com/blog/microsoft-security-blog/-/4450412))

### Why AI is a good fit

- In a randomised controlled trial of Microsoft's phishing triage agent, analysts with AI support found
  up to 6.5 times as many true positives per minute and were 77% more accurate.
  ([arXiv 2511.13860](https://arxiv.org/html/2511.13860v1))

### Why now

- Attackers already use generative AI: in the 2026 DBIR, phishing made up 44% of AI-assisted
  initial-access techniques. ([Mimecast on DBIR 2026](https://www.mimecast.com/blog/2026-verizon-dbir-findings/))
  Well-written phishing removes the old "bad grammar" clue that non-experts relied on.
- Enterprise answers exist, but they sit behind enterprise licensing (Defender for Office 365 Plan 2
  and Security Copilot for the Microsoft agent). Small teams are left out.
- Small, fast language models now cost a fraction of a cent per email, which makes a free or very
  cheap triage tool practical.

### First-hand evidence

I work in security operations and incident response, and reported-email triage is part of my team's
daily workload. The pattern matches the published numbers: most reports are harmless, the check is
repetitive, and the quality of the ticket note varies by analyst.
