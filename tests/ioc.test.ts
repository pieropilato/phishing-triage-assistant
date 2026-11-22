import { describe, it, expect } from "vitest";
import { extractIocs, extractUrls, extractIps, defang, cleanUrl } from "@/lib/ioc";

describe("IOC extraction", () => {
  it("extracts URLs and strips trailing punctuation", () => {
    const urls = extractUrls("Go to https://evil.example/login). Also http://203.0.113.45/a.php, thanks.");
    expect(urls).toEqual(["https://evil.example/login", "http://203.0.113.45/a.php"]);
  });

  it("removes duplicates", () => {
    expect(extractUrls("http://a.example http://a.example")).toHaveLength(1);
  });

  it("only keeps valid IPv4 addresses", () => {
    expect(extractIps("ok 203.0.113.45 bad 999.1.1.1 version 1.2.3")).toEqual(["203.0.113.45"]);
  });

  it("builds domains from URLs and email addresses, without raw IPs", () => {
    const iocs = extractIocs("Mail bob@Corp.example or visit https://login.evil.example/x and http://198.51.100.7/");
    expect(iocs.emails).toEqual(["bob@corp.example"]);
    expect(iocs.domains).toContain("login.evil.example");
    expect(iocs.domains).toContain("corp.example");
    expect(iocs.domains).not.toContain("198.51.100.7");
  });

  it("extracts MD5, SHA1 and SHA256 hashes", () => {
    const md5 = "d41d8cd98f00b204e9800998ecf8427e";
    const sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(extractIocs(`${md5} and ${sha256}`).hashes).toEqual([md5, sha256]);
  });

  it("returns empty lists for plain text", () => {
    const iocs = extractIocs("Just a normal sentence with no indicators.");
    expect(iocs.urls).toEqual([]);
    expect(iocs.ips).toEqual([]);
  });
});

describe("defang", () => {
  it("defangs URLs, emails and IPs", () => {
    expect(defang("https://evil.example/a")).toBe("hxxps[://]evil[.]example/a");
    expect(defang("user@evil.example")).toBe("user[@]evil[.]example");
    expect(defang("203.0.113.45")).toBe("203[.]0[.]113[.]45");
  });

  it("cleanUrl leaves a clean URL untouched", () => {
    expect(cleanUrl("https://a.example/path?x=1")).toBe("https://a.example/path?x=1");
  });
});
