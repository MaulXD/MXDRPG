import "server-only";

import Link from "next/link";

import { getUserById } from "@/lib/auth/user-store";

import "./adventure-player-sheets.css";

/** Ficha de jogador na lista da aventura. Vale para Eldarin (RoomActor) e Um Anel. */
export type AdventurePlayerSheetItem = {
  id: string;
  name: string;
  ownerId: string;
  portraitUrl?: string | null;
  tokenImageUrl?: string | null;
  /** Texto curto ao lado do jogador, ex.: "nv 1 Guerreiro" ou "Capitão". */
  meta: string;
};

type Props = {
  characters: AdventurePlayerSheetItem[];
};

async function resolveOwnerDisplayNames(ownerIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ownerIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (ownerId) => {
      const user = await getUserById(ownerId);
      // Só apelido: o nome real da conta nunca aparece para outro usuário.
      const displayName = user?.nickname?.trim() || "Jogador";
      return [ownerId, displayName] as const;
    })
  );
  return new Map(entries);
}

function CharacterToken({ actor }: { actor: AdventurePlayerSheetItem }) {
  const imageUrl = actor.tokenImageUrl ?? actor.portraitUrl;
  const initial = actor.name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <span className="adventure-player-sheets__token" aria-hidden>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      ) : (
        <span className="adventure-player-sheets__token-initial">{initial}</span>
      )}
    </span>
  );
}

export async function AdventurePlayerSheetsList({ characters }: Props) {
  const ownerNames = await resolveOwnerDisplayNames(characters.map((actor) => actor.ownerId));

  return (
    <ul className="adventure-player-sheets">
      {characters.map((actor) => {
        const playerName = ownerNames.get(actor.ownerId) ?? "Jogador";
        return (
          <li key={actor.id} className="adventure-player-sheets__row">
            <CharacterToken actor={actor} />
            <div className="adventure-player-sheets__body">
              <Link href={`/personagem/${actor.id}`} className="adventure-player-sheets__name">
                {actor.name}
              </Link>
              <span className="adventure-player-sheets__meta">
                <span className="adventure-player-sheets__player">{playerName}</span>
                {actor.meta ? ` · ${actor.meta}` : ""}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
