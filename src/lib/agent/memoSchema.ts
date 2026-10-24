import { z } from "zod";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export const memoDraftSchema = z.object({
  winnerConceptId: z.string(),
  summary: z.string().refine((value) => wordCount(value) <= 80, "Summary is over 80 words."),
  concepts: z
    .array(
      z.object({
        conceptId: z.string(),
        verdict: z.enum(["go", "caution", "no-go"]),
        headline: z.string().refine((value) => wordCount(value) <= 20, "Headline is over 20 words."),
        reasons: z
          .array(
            z.object({
              text: z.string(),
              hopId: z.string(),
              entityName: z.string(),
              affinity: z.number(),
            }),
          )
          .min(2)
          .max(4),
      }),
    )
    .min(1)
    .max(2),
  landlordPitch: z.string().refine((value) => wordCount(value) <= 120, "Landlord pitch is over 120 words."),
  risks: z.array(z.string()).max(3).optional(),
});

export type MemoDraft = z.infer<typeof memoDraftSchema>;
