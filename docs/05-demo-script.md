# Demo script (2 minutes)

Record the browser tab only. Use a private window so it also proves the URL works when logged out.

| Time | Show | Say |
|---|---|---|
| 0:00-0:15 | Live URL, landing page | "This is Phishing Triage Assistant. Small IT teams spend up to 30 minutes checking each email staff report as suspicious. This gives a first verdict with evidence in seconds." |
| 0:15-0:50 | Click **Fake Microsoft 365 login**, then **Analyse email** | "I paste the reported email with headers. The result is Phishing. Here is why: DMARC failed, Reply-To goes to a different domain, the sender imitates Microsoft, and the link text says microsoftonline but opens a raw IP address." |
| 0:50-1:05 | Scroll to indicators and actions | "Indicators are extracted by code and defanged, so nobody clicks them by mistake. Below are the recommended actions and a reply for the person who reported it." |
| 1:05-1:15 | Click **Copy ticket note** | "One click copies a note for the ticket." |
| 1:15-1:35 | Click **Invoice / bank change (BEC)**, analyse | "This one has no links at all, which link scanners miss. The AI still catches the payment-change pretext from a free mailbox." |
| 1:35-1:45 | Click **Normal internal email**, analyse | "A normal email comes back Legitimate with no red flags." |
| 1:45-2:00 | GitHub repo: Actions tab (green), then README | "The code is public, with tests and a GitHub Actions pipeline. The AI key lives only in the hosting environment. A guardrail stops the AI from calling an email safe when hard evidence says otherwise." |

Tips: zoom the browser to 110-125%, close other tabs, and upload the video as an unlisted YouTube
video or a Loom link that anyone with the link can view.
