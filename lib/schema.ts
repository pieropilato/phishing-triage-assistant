import { z } from "zod";

export const MIN_EMAIL_CHARS = 20;
export const MAX_EMAIL_CHARS = 20_000;

/** Request body accepted by POST /api/triage. */
export const TriageRequestSchema = z.object({
  email: z
    .string({ error: "Paste the email text." })
    .trim()
    .min(MIN_EMAIL_CHARS, `Paste at least ${MIN_EMAIL_CHARS} characters of the email.`)
    .max(MAX_EMAIL_CHARS, `The email is too long (max ${MAX_EMAIL_CHARS.toLocaleString("en-US")} characters).`),
});

export const VerdictSchema = z.enum(["phishing", "suspicious", "spam", "legitimate"]);

/** What the AI model must return. Anything else is rejected. */
export const ModelOutputSchema = z.object({
  verdict: VerdictSchema,
  confidence: z.number().min(0).max(100),
  summary: z.string().min(1).max(800),
  reasons: z.array(z.string().min(1).max(300)).min(1).max(6),
  recommended_actions: z.array(z.string().min(1).max(300)).min(1).max(6),
  reporter_reply: z.string().max(600).optional().default(""),
});

export type ModelOutput = z.infer<typeof ModelOutputSchema>;

/**
 * Extracts and validates the JSON object from a model reply.
 * Handles ```json fences and extra prose around the object.
 */
export function parseModelOutput(text: string): ModelOutput {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Model reply did not contain a JSON object.");
  const data = JSON.parse(cleaned.slice(start, end + 1));
  if (typeof data.confidence === "number" && data.confidence <= 1 && data.confidence > 0) {
    data.confidence = Math.round(data.confidence * 100); // some models answer 0-1
  }
  if (typeof data.verdict === "string") data.verdict = data.verdict.toLowerCase().trim();
  return ModelOutputSchema.parse(data);
}
