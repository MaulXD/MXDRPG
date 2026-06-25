import { canTrackRoomPresence } from "@/lib/auth/presence-access";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { presenceEventsAfter, touchRoomPresence } from "@/lib/room/presence";
import { getRoomRevision } from "@/lib/room/revision";
import { tickRoomAutoPassThrottled } from "@/lib/room/auto-pass-tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

const POLL_MS = 500;
const HEARTBEAT_MS = 15_000;
/** Intervalo mínimo entre pushes de revisão — agrupa rajadas. */
const REVISION_PUSH_MIN_MS = 200;

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
  let lastSentAt = Date.now();
  let lastHeartbeat = Date.now();
  const user = auth.user;
  const presenceLabel = user?.nickname?.trim() || user?.name?.trim() || "Jogador";
  let tracksPresence = false;
  if (user) {
    tracksPresence = await canTrackRoomPresence(auth.room, user);
  }

  let lastPresenceEventId = 0;
  const connectedAt = Date.now();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const push = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const flushPresence = () => {
        const { events, lastId } = presenceEventsAfter(roomId, lastPresenceEventId);
        for (const ev of events) {
          if (ev.at >= connectedAt) push(ev);
        }
        lastPresenceEventId = lastId;
      };

      if (tracksPresence && user) {
        void touchRoomPresence(roomId, user.id, presenceLabel).then(() => flushPresence());
      } else {
        flushPresence();
      }

      push({ type: "connected", revision: auth.room.revision });

      const interval = setInterval(async () => {
        try {
          flushPresence();

          await tickRoomAutoPassThrottled(roomId);
          const rev = await getRoomRevision(roomId);
          if (rev == null) {
            push({ type: "gone" });
            clearInterval(interval);
            controller.close();
            return;
          }
          const now = Date.now();
          if (rev > lastSent && now - lastSentAt >= REVISION_PUSH_MIN_MS) {
            lastSent = rev;
            lastSentAt = now;
            push({ type: "revision", revision: rev });
          }
          if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
            lastHeartbeat = Date.now();
            if (tracksPresence && user) {
              await touchRoomPresence(roomId, user.id, presenceLabel);
            }
            flushPresence();
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
