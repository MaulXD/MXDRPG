import { canTrackRoomPresence } from "@/lib/auth/presence-access";
import { requireRoomView } from "@/lib/auth/authorize-room-view";
import { presenceEventsAfter, touchRoomPresence } from "@/lib/room/presence";
import { getRoomRevision } from "@/lib/room/revision";
import { tickRoomAutoPassThrottled } from "@/lib/room/auto-pass-tick";
import { onRoomUpdated } from "@/lib/room/notifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

const HEARTBEAT_MS = 15_000;
const TICK_MS = 5_000;

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

      const cleanup = () => {
        clearInterval(tickInterval);
        clearInterval(heartbeatInterval);
        unsubNotifier();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      if (tracksPresence && user) {
        void touchRoomPresence(roomId, user.id, presenceLabel).then(() => flushPresence());
      } else {
        flushPresence();
      }

      push({ type: "connected", revision: auth.room.revision });

      // Revision pushed instantly via EventEmitter — no POLL
      const unsubNotifier = onRoomUpdated(roomId, (revision) => {
        if (revision > lastSent) {
          lastSent = revision;
          push({ type: "revision", revision });
        }
      });

      const tickInterval = setInterval(async () => {
        try {
          await tickRoomAutoPassThrottled(roomId);
          const rev = await getRoomRevision(roomId);
          if (rev == null) {
            push({ type: "gone" });
            cleanup();
          }
        } catch {
          cleanup();
        }
      }, TICK_MS);

      const heartbeatInterval = setInterval(() => {
        try {
          flushPresence();
          if (tracksPresence && user) {
            void touchRoomPresence(roomId, user.id, presenceLabel);
          }
          flushPresence();
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
          lastHeartbeat = Date.now();
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      request.signal.addEventListener("abort", cleanup);
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
