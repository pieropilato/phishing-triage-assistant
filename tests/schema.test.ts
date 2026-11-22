import { describe, it, expect } from "vitest";
import { TriageRequestSchema, parseModelOutput, MAX_EMAIL_CHARS } from "@/lib/schema";

const GOOD = {
  verdict: "phishing",
  confidence: 92,
  summary: "Credential phishing.",
  reasons: ["Look-alike domain"],
  recommended_actions: ["Block sender"],
  reporter_reply: "Thanks for reporting.",
};

describe("input validation", () => {
  it("accepts a normal email", () => {
    expect(TriageRequestSchema.safeParse({ email: "From: a@b.example\n\nHello there, this is a test." }).success).toBe(true);
  });

  it("rejects empty, too short, too long and non-string input", () => {
    expect(TriageRequestSchema.safeParse({ email: "" }).success).toBe(false);
    expect(TriageRequestSchema.safeParse({ email: "   short   " }).success).toBe(false);
    expect(TriageRequestSchema.safeParse({ email: "x".repeat(MAX_EMAIL_CHARS + 1) }).success).toBe(false);
    expect(TriageRequestSchema.safeParse({ email: 123 }).success).toBe(false);
    expect(TriageRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("model output parsing", () => {
  it("parses plain JSON", () => {
    expect(parseModelOutput(JSON.stringify(GOOD)).verdict).toBe("phishing");
  });

  it("parses JSON wrapped in a markdown fence with extra prose", () => {
    const text = "Here is the result:\n```json\n" + JSON.stringify(GOOD) + "\n```\nDone.";
    expect(parseModelOutput(text).confidence).toBe(92);
  });

  it("converts 0-1 confidence to a percentage and normalises verdict case", () => {
    const out = parseModelOutput(JSON.stringify({ ...GOOD, confidence: 0.85, verdict: "Phishing" }));
    expect(out.confidence).toBe(85);
    expect(out.verdict).toBe("phishing");
  });

  it("rejects unknown verdicts, missing fields and non-JSON", () => {
    expect(() => parseModelOutput(JSON.stringify({ ...GOOD, verdict: "safe" }))).toThrow();
    expect(() => parseModelOutput(JSON.stringify({ verdict: "spam" }))).toThrow();
    expect(() => parseModelOutput("I think it is phishing.")).toThrow();
  });
});
