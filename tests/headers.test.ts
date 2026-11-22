import { describe, it, expect } from "vitest";
import { parseEmail, parseAddress, sameOrgDomain } from "@/lib/headers";

const RAW = `From: "IT Support" <it@corp-help.example>
Reply-To: attacker@other.example
Subject: Password expires
 today
Authentication-Results: mx.example; spf=softfail smtp.mailfrom=x; dkim=none; dmarc=fail

Hello, please sign in.`;

describe("header parsing", () => {
  it("parses From, Reply-To, folded Subject and body", () => {
    const e = parseEmail(RAW);
    expect(e.hasHeaders).toBe(true);
    expect(e.from).toEqual({ name: "IT Support", address: "it@corp-help.example", domain: "corp-help.example" });
    expect(e.replyTo?.domain).toBe("other.example");
    expect(e.subject).toBe("Password expires today");
    expect(e.body).toBe("Hello, please sign in.");
  });

  it("reads SPF, DKIM and DMARC results", () => {
    expect(parseEmail(RAW).auth).toEqual({ spf: "softfail", dkim: "none", dmarc: "fail" });
  });

  it("treats text without headers as body only", () => {
    const e = parseEmail("Hi there,\nplease see the note: it is important.");
    expect(e.hasHeaders).toBe(false);
    expect(e.from).toBeNull();
    expect(e.auth.dmarc).toBe("unknown");
  });

  it("parses bare addresses and rejects junk", () => {
    expect(parseAddress("someone@site.example")?.domain).toBe("site.example");
    expect(parseAddress("not an address")).toBeNull();
  });

  it("matches sub-domains of the same organisation", () => {
    expect(sameOrgDomain("mail.contoso.example", "contoso.example")).toBe(true);
    expect(sameOrgDomain("contoso.example", "evil.example")).toBe(false);
  });
});
