import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureUserFromClerk } from "@/lib/db/users";
import { isClerkEnabled } from "@/lib/auth/clerk-config";

export async function POST(request: NextRequest) {
  if (!isClerkEnabled() || !dbEnabled()) {
    return NextResponse.json({ error: "Webhook indisponível" }, { status: 503 });
  }

  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SIGNING_SECRET ausente" }, { status: 500 });
  }

  let evt;
  try {
    evt = await verifyWebhook(request, { signingSecret: secret });
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = evt.data;
    const clerkId = data.id;
    const email =
      data.email_addresses?.[0]?.email_address ?? `${clerkId}@users.clerk.local`;
    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
      data.username ||
      "Jogador";

    await ensureUserFromClerk({ clerkId, email, name: name.slice(0, 80) });
  }

  return NextResponse.json({ ok: true });
}
