"use client";

import Link from "next/link";
import type { CharacterSheet } from "@/lib/character/types";
import type { LevelUpRoomResponse } from "@/hooks/useRoomSync";
import { CharacterIdentityEditor } from "@/components/character/CharacterIdentityEditor";
import { LevelUpWizard } from "@/components/character/LevelUpWizard";
import { FutureLevelsPanel } from "@/components/character/FutureLevelsPanel";
import { SubclassTrackPanel } from "@/components/character/SubclassTrackPanel";
import { SheetEditRequestButton } from "@/components/character/SheetEditRequestButton";

type Props = {
  character: CharacterSheet;
  live: CharacterSheet;
  roomId: string;
  adventureId?: string | null;
  inRoom: boolean;
  canEdit: boolean;
  snapshotRevision?: number;
  onRefresh: () => void;
  onLevelApplied: (patch: LevelUpRoomResponse) => void;
};

/** Ferramentas de edição — drawer inferior da ficha DDB (sem duplicar traços do painel direito). */
export function SheetDdbManagePanel({
  character,
  live,
  roomId,
  adventureId,
  inRoom,
  canEdit,
  snapshotRevision,
  onRefresh,
  onLevelApplied,
}: Props) {
  if (!canEdit && !inRoom) return null;

  return (
    <div className="sheet-ddb-manage">
      {inRoom ? (
        <div className="sheet-ddb-manage__sync">
          <span className="sheet-live-dot" aria-hidden />
          Sync mesa · rev {snapshotRevision ?? 0}
        </div>
      ) : null}

      {canEdit ? (
        <LevelUpWizard
          actor={live}
          roomId={roomId}
          canEdit={canEdit}
          onDone={onRefresh}
          onApplied={(patch) => onLevelApplied(patch)}
        />
      ) : null}

      {canEdit && inRoom ? (
        <Link
          href={`/personagem/${character.id}`}
          className="btn btn-ghost sheet-ddb-manage__link"
        >
          Editar retrato e identidade ↗
        </Link>
      ) : null}

      <SubclassTrackPanel actor={live} popup />
      <FutureLevelsPanel actor={live} compact />

      {canEdit && inRoom ? (
        <CharacterIdentityEditor
          actor={live}
          roomId={roomId}
          canEdit={canEdit}
          onSaved={onRefresh}
        />
      ) : null}

      {canEdit && adventureId ? (
        <details className="sheet-structural-edit sheet-ddb-manage__structural">
          <summary>Reconstruir ficha (aprovação do mestre)</summary>
          <p className="sheet-ddb-manage__hint">
            Para refazer raça/classe ou só o último nível, envie uma solicitação — o dia a dia da
            ficha continua editável por você.
          </p>
          <SheetEditRequestButton
            characterId={character.id}
            adventureId={adventureId}
            roomId={inRoom ? roomId : undefined}
            variant="inline"
          />
        </details>
      ) : null}
    </div>
  );
}
