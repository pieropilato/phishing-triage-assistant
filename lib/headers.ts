// Lightweight parser for the parts of an email header that matter for triage.
// Accepts either a full raw message (headers + body) or just the body text.

export type AuthResult = "pass" | "fail" | "softfail" | "neutral" | "none" | "temperror" | "permerror" | "unknown";

export interface Address {
  name: string;
  address: string;
  domain: string;
}

export interface ParsedEmail {
  hasHeaders: boolean;
  from: Address | null;
  replyTo: Address | null;
  returnPath: Address | null;
  subject: string;
  auth: { spf: AuthResult; dkim: AuthResult; dmarc: AuthResult };
  body: string;
}

const HEADER_LINE = /^[A-Za-z][A-Za-z0-9-]*:\s?/;
const KNOWN_HEADERS = /^(from|to|subject|date|reply-to|return-path|received|message-id|authentication-results|mime-version|content-type|cc|sender|x-[a-z0-9-]+):/i;

/** Splits a raw message into header block and body. Unfolds continuation lines. */
export function splitMessage(raw: string): { headerLines: string[]; body: string } {
  const text = raw.replace(/\r\n/g, "\n").trimStart();
  const lines = text.split("\n");
  if (!lines.length || !KNOWN_HEADERS.test(lines[0])) {
    return { headerLines: [], body: text };
  }
  const headerLines: string[] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") break;
    if (/^[ \t]/.test(line) && headerLines.length) {
      headerLines[headerLines.length - 1] += " " + line.trim();
    } else if (HEADER_LINE.test(line)) {
      headerLines.push(line);
    } else {
      break; // not a header any more
    }
  }
  return { headerLines, body: lines.slice(i).join("\n").trim() };
}

export function parseAddress(value: string | undefined): Address | null {
  if (!value) return null;
  const angle = value.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/);
  const bare = value.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const address = (angle?.[1] ?? bare?.[0] ?? "").toLowerCase();
  if (!address) return null;
  const name = angle ? value.slice(0, value.indexOf("<")).replace(/["']/g, "").trim() : "";
  return { name, address, domain: address.split("@")[1] ?? "" };
}

function readAuth(results: string, mech: "spf" | "dkim" | "dmarc"): AuthResult {
  const m = results.match(new RegExp(`\\b${mech}=(pass|fail|softfail|neutral|none|temperror|permerror)\\b`, "i"));
  return m ? (m[1].toLowerCase() as AuthResult) : "unknown";
}

export function parseEmail(raw: string): ParsedEmail {
  const { headerLines, body } = splitMessage(raw);
  const headers = new Map<string, string>();
  const authParts: string[] = [];
  for (const line of headerLines) {
    const idx = line.indexOf(":");
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (name === "authentication-results" || name === "arc-authentication-results") authParts.push(value);
    if (!headers.has(name)) headers.set(name, value);
  }
  const authText = authParts.join(" ; ");
  return {
    hasHeaders: headerLines.length > 0,
    from: parseAddress(headers.get("from")),
    replyTo: parseAddress(headers.get("reply-to")),
    returnPath: parseAddress(headers.get("return-path")),
    subject: headers.get("subject") ?? "",
    auth: {
      spf: readAuth(authText, "spf"),
      dkim: readAuth(authText, "dkim"),
      dmarc: readAuth(authText, "dmarc"),
    },
    body,
  };
}

/** Compares organisational domains loosely: mail.contoso.com matches contoso.com. */
export function sameOrgDomain(a: string, b: string): boolean {
  if (!a || !b) return true;
  const base = (d: string) => d.toLowerCase().split(".").slice(-2).join(".");
  return base(a) === base(b);
}
