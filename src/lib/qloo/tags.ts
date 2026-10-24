import { qlooGet } from "@/lib/qloo/client";

export async function searchTags(query: string, take = 8): Promise<unknown> {
  return qlooGet("/v2/tags", { query, take: String(Math.min(take, 50)) });
}
