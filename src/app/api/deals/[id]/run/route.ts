import { runSavedDeal } from "@/lib/agent/runSavedDeal";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let rerun = false;
  try {
    const body: unknown = await request.json();
    rerun = typeof body === "object" && body !== null && "rerun" in body && body.rerun === true;
  } catch {
    rerun = false;
  }

  const deal = await runSavedDeal(id, { rerun });
  if (!deal) return Response.json({ error: "This deal is not on the desk." }, { status: 404 });
  return Response.json(deal);
}
