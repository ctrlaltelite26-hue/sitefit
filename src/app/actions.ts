"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { buildCustomDeal, buildPresetDeal } from "@/lib/build-deal";
import { saveDeal } from "@/lib/store";

export async function openDeal(formData: FormData) {
  const ungrounded = formData.get("ungrounded") === "true";
  const presetId = formData.get("presetId");
  const deal =
    typeof presetId === "string" && presetId.length > 0
      ? buildPresetDeal(randomUUID(), presetId, ungrounded)
      : buildCustomDeal(randomUUID(), {
          locality: String(formData.get("locality") ?? ""),
          conceptA: String(formData.get("conceptA") ?? ""),
          conceptB: String(formData.get("conceptB") ?? ""),
          ungrounded,
        });

  if (!deal) return;
  await saveDeal(deal);
  redirect(`/deals/${deal.id}`);
}
