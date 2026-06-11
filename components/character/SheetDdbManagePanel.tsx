"use client";

import type { CharacterSheet } from "@/lib/character/types";
import { CharacterIdentityEditor } from "@/components/character/CharacterIdentityEditor";
import { FutureLevelsPanel } from "@/components/character/FutureLevelsPanel";
import { SubclassTrackPanel } from "@/components/character/SubclassTrackPanel";
import { CombatLoadoutPanel } from "@/components/character/CombatLoadoutPanel";
import { SheetEditRequestButton } from "@/components/character/SheetEditRequestButton";
import type { IdentityPatch } from "@/lib/character/identity";
import type { CombatLoadout } from "@/lib/combat/types";

type Props = {
  character: CharacterSheet;
  live: CharacterSheet;
  roomId: string;
  adventureId?: string | null;
  inRoom: boolean;
  canEdit: boolean;
  snapshotRevision?: number;
  onRefresh: () => void;
  onSaveIdentity?: (patch: IdentityPatch) => Promise<void>;
  onSaveCombatLoadout?: (loadout: CombatLoadout) => Promise<void>;
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
  onSaveIdentity,
  onSaveCombatLoadout,
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

      <SubclassTrackPanel actor={live} popup />
      <FutureLevelsPanel actor={live} compact />

      {canEdit ? (
        <CharacterIdentityEditor
          actor={live}
          roomId={inRoom ? roomId : undefined}
          canEdit={canEdit}
          onSaved={onRefresh}
          onSaveIdentity={!inRoom ? onSaveIdentity : undefined}
        />
      ) : null}

      {canEdit ? (
        <CombatLoadoutPanel
          actor={live}
          roomId={inRoom ? roomId : undefined}
          canEdit={canEdit}
          onSaved={onRefresh}
          onSaveLoadout={!inRoom ? onSaveCombatLoadout : undefined}
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
