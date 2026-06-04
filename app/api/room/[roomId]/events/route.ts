import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { getRoomRevision } from "@/lib/room/revision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

const POLL_MS = 800;
const HEARTBEAT_MS = 15_000;

export async function GET(request: Request, { params }: Params) {
  const { roomId } = await params;
  const url = new URL(request.url);
  const since = Math.max(0, parseInt(url.searchParams.get("since") ?? "0", 10) || 0);
  const invite = url.searchParams.get("invite");

  const auth = await requireRoomView(roomId, invite);
  if ("error" in auth) {
    return new Response(auth.error, { status: auth.status });
  }

  let lastSent = since;
  let lastHeartbeat = Date.now();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const push = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      push({ type: "connected", revision: auth.room.revision });

      const interval = setInterval(async () => {
        try {
          const rev = await getRoomRevision(roomId);
          if (rev == null) {
            push({ type: "gone" });
            clearInterval(interval);
            controller.close();
            return;
          }
          if (rev > lastSent) {
            lastSent = rev;
            push({ type: "revision", revision: rev });
          }
          if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
            lastHeartbeat = Date.now();
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, POLL_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
