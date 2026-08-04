import "server-only";

import {
  isOAuthEphemeralSessionId,
  oauthIdentityFromSession,
} from "@/lib/auth/oauth-session-id";
import { getUserById } from "@/lib/auth/user-store";
import type { SessionUser } from "@/lib/auth/types";
import { dbEnabled } from "@/lib/db/enabled";
import {
  backfillDefaultNickname,
  ensureUserFromOAuth,
  fetchUserByClerkId,
  fetchUserByEmail,
  fetchUserByIdStrict,
} from "@/lib/db/users";

async function materializeOAuthUser(user: SessionUser): Promise<SessionUser> {
  const oauth = oauthIdentityFromSession(user);
  if (!oauth) {
    throw new Error("Conta não encontrada — saia e entre de novo");
  }

  const row = await ensureUserFromOAuth(
    {
      provider: oauth.provider,
      subject: oauth.subject,
      email: user.email,
      name: user.name,
      oauthAvatarUrl: user.oauthAvatarUrl,
    },
    { strict: true }
  );

  if (isOAuthEphemeralSessionId(row.id)) {
    throw new Error(
      "Não foi possível criar sua conta no banco — saia, entre de novo com Google ou avise o suporte"
    );
  }

  return { ...row, clerkId: user.clerkId ?? row.clerkId ?? null };
}

/** Garante linha em `eldarin_users` para o usuário da sessão (OAuth efêmero, usr_*). */
export async function materializeSessionUser(user: SessionUser): Promise<SessionUser> {
  const resolved = await resolveSessionUser(user);
  if (resolved.nickname?.trim() || !dbEnabled()) return resolved;
  try {
    const backfilled = await backfillDefaultNickname(resolved.id);
    return backfilled ?? resolved;
  } catch (err) {
    console.error("[materializeSessionUser] backfill de apelido falhou:", err);
    return resolved;
  }
}

async function resolveSessionUser(user: SessionUser): Promise<SessionUser> {
  /**
   * Materializar OAuth só quando a conta AINDA NÃO TEM linha no banco — id
   * efêmero `google-…`/`discord-…`, que só acontece se o banco estava fora no
   * momento do login.
   *
   * Antes o gatilho era `oauthIdentityFromSession(user)`, que devolve identidade
   * sempre que `oauthProvider` + `oauthSubject` estão na sessão — ou seja,
   * SEMPRE para um usuário Google, inclusive um já materializado com id `usr_`.
   * O efeito: toda requisição de sessão OAuth rodava `ensureUserFromOAuth`
   * (2–3 queries + possível UPDATE) com `strict: true`, enquanto sessão por
   * senha fazia 1 query. Qualquer soluço do banco derrubava quem entrou com
   * Google e não derrubava quem entrou com senha — e `/api/notifications` faz
   * poll a cada 30s, multiplicando isso por jogador.
   *
   * Com id `usr_` já válido, o caminho barato abaixo (`fetchUserByIdStrict`)
   * resolve igual ao da senha. O retrato do Google deixa de ser reconferido a
   * cada requisição, mas isso não perde nada: `oauthAvatarUrl` vem do cookie,
   * que só muda quando o usuário loga de novo — momento em que
   * `completeOAuthLogin` grava o valor novo.
   */
  if (isOAuthEphemeralSessionId(user.id)) {
    try {
      return await materializeOAuthUser(user);
    } catch (err) {
      console.error("[materializeSessionUser] oauth materialize failed:", err);
      throw err instanceof Error
        ? err
        : new Error("Não foi possível criar sua conta no banco — saia e entre de novo");
    }
  }

  if (user.id.startsWith("usr_")) {
    try {
      const row = await fetchUserByIdStrict(user.id);
      if (row) return { ...row, clerkId: user.clerkId ?? row.clerkId ?? null };
    } catch (err) {
      console.error("[materializeSessionUser] fetchUserByIdStrict failed:", err);
      throw err instanceof Error ? err : new Error("Banco indisponível — tente de novo");
    }

    try {
      const byEmail = await fetchUserByEmail(user.email);
      if (byEmail) {
        const row = await fetchUserByIdStrict(byEmail.id);
        if (row) return { ...row, clerkId: user.clerkId ?? row.clerkId ?? null };
      }
    } catch (err) {
      console.error("[materializeSessionUser] fetchUserByEmail failed:", err);
    }

    const local = await getUserById(user.id);
    if (local) return { ...local, clerkId: user.clerkId ?? local.clerkId ?? null };

    if (!dbEnabled()) return user;
    throw new Error("Conta não encontrada — saia e entre de novo");
  }

  const clerkId =
    user.clerkId?.trim() ||
    (user.id.startsWith("clerk-") ? user.id.slice("clerk-".length) : null);
  if (clerkId) {
    try {
      const existing = await fetchUserByClerkId(clerkId);
      if (existing) {
        const row = await fetchUserByIdStrict(existing.id);
        if (row) return { ...row, clerkId };
      }
    } catch (err) {
      console.error("[materializeSessionUser] legacy clerk_id lookup failed:", err);
    }
  }

  if (!dbEnabled()) return user;
  throw new Error("Conta não encontrada — saia e entre de novo");
}

/** SSR / páginas — nunca derruba o render; APIs usam `materializeSessionUser` (strict). */
export async function safeMaterializeSessionUser(user: SessionUser): Promise<SessionUser> {
  try {
    return await materializeSessionUser(user);
  } catch (err) {
    console.error("[safeMaterializeSessionUser]", err);
    return user;
  }
}
