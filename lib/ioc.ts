// Indicator of compromise (IOC) extraction and defanging.
// Pure functions only: no network calls, so they are safe to run on untrusted input.

export interface Iocs {
  urls: string[];
  domains: string[];
  ips: string[];
  emails: string[];
  hashes: string[];
}

const MAX_PER_TYPE = 50;

const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const HASH_RE = /\b(?:[a-fA-F0-9]{64}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})\b/g;

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).slice(0, MAX_PER_TYPE);
}

/** Removes punctuation that often sticks to the end of a URL in prose. */
export function cleanUrl(raw: string): string {
  return raw.replace(/[).,;:!?\]>'"]+$/, "");
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** Returns the lower-case host of a URL, or null if it cannot be parsed. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  return unique(matches.map(cleanUrl).filter((u) => hostOf(u) !== null));
}

export function extractEmails(text: string): string[] {
  return unique((text.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()));
}

export function extractIps(text: string): string[] {
  return unique((text.match(IPV4_RE) ?? []).filter(isValidIpv4));
}

export function extractHashes(text: string): string[] {
  return unique((text.match(HASH_RE) ?? []).map((h) => h.toLowerCase()));
}

export function extractDomains(urls: string[], emails: string[]): string[] {
  const fromUrls = urls.map(hostOf).filter((h): h is string => !!h && !isValidIpv4(h));
  const fromEmails = emails.map((e) => e.split("@")[1]);
  return unique([...fromUrls, ...fromEmails]);
}

export function extractIocs(text: string): Iocs {
  const urls = extractUrls(text);
  const emails = extractEmails(text);
  return {
    urls,
    domains: extractDomains(urls, emails),
    ips: extractIps(text),
    emails,
    hashes: extractHashes(text),
  };
}

/**
 * Defangs an indicator so it cannot be clicked by mistake when pasted into a ticket.
 * https://evil.com/a -> hxxps://evil[.]com/a ; user@evil.com -> user[@]evil[.]com
 */
export function defang(value: string): string {
  return value
    .replace(/^http/i, "hxxp")
    .replace(/:\/\//, "[://]")
    .replace(/@/g, "[@]")
    .replace(/\./g, "[.]");
}

export function defangIocs(iocs: Iocs): Iocs {
  return {
    urls: iocs.urls.map(defang),
    domains: iocs.domains.map(defang),
    ips: iocs.ips.map(defang),
    emails: iocs.emails.map(defang),
    hashes: iocs.hashes, // hashes are not clickable
  };
}
