import { runSavedDeal } from "@/lib/agent/runSavedDeal";
import type { RunProgress } from "@/lib/agent/progress";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let rerun = false;
  try {
    const body: unknown = await request.json();
    rerun = typeof body === "object" && body !== null && "rerun" in body && body.rerun === true;
  } catch {
    rerun = false;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        const deal = await runSavedDeal(id, {
          rerun,
          onProgress: (event: RunProgress) => send({ type: "progress", ...event }),
        });
        if (!deal) send({ type: "error", message: "This deal is not on the desk." });
        else send({ type: "done", deal });
      } catch {
        send({ type: "error", message: "The memo run failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
