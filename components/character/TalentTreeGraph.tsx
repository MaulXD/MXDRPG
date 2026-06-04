"use client";

import type { CharacterTalent, SubclassTrack } from "@/lib/character/subclass-tracks";
import { buildTalentTreeNodes, type TalentTreeNode } from "@/lib/character/level-up-ui";

type Props = {
  track: SubclassTrack;
  owned: CharacterTalent[];
  actorLevel: number;
  /** Nível que está sendo escolhido no level-up (ex.: 4, 8) */
  pickingLevel?: number;
  selectedId?: string;
  onSelect?: (talentId: string) => void;
  compact?: boolean;
};

function nodeClass(node: TalentTreeNode, selectedId?: string): string {
  const base = "lu-tree-node";
  const state =
    node.talentId && selectedId === node.talentId && node.state === "selectable"
      ? "selected"
      : node.state;
  return `${base} lu-tree-node--${state} lu-tree-node--${node.kind}`;
}

export function TalentTreeGraph({
  track,
  owned,
  actorLevel,
  pickingLevel,
  selectedId,
  onSelect,
  compact = false,
}: Props) {
  const nodes = buildTalentTreeNodes(track, owned, actorLevel, pickingLevel, selectedId);

  return (
    <div className={`lu-tree ${compact ? "lu-tree--compact" : ""}`} role="list" aria-label={`Trilha ${track.subclass}`}>
      <header className="lu-tree-head">
        <span className="lu-tree-class">{track.classId}</span>
        <h4 className="lu-tree-title">{track.subclass}</h4>
        <p className="lu-tree-specialty">{track.specialty}</p>
      </header>

      <ol className="lu-tree-chain">
        {nodes.map((node, i) => {
          const clickable =
            node.talentId &&
            node.state === "selectable" &&
            onSelect &&
            node.kind === "talent";
          const Tag = clickable ? "button" : "div";
          return (
            <li key={node.key} className="lu-tree-step">
              {i > 0 ? <span className="lu-tree-connector" aria-hidden /> : null}
              <Tag
                type={clickable ? "button" : undefined}
                className={nodeClass(node, selectedId)}
                onClick={clickable ? () => onSelect(node.talentId!) : undefined}
                disabled={clickable ? false : undefined}
                aria-pressed={clickable ? selectedId === node.talentId : undefined}
              >
                <span className="lu-tree-lv">Nv {node.level}</span>
                <span className="lu-tree-name">{node.label}</span>
                {node.blurb ? <span className="lu-tree-blurb">{node.blurb}</span> : null}
                <span className="lu-tree-badge" aria-hidden>
                  {node.state === "owned"
                    ? "✓"
                    : node.state === "selectable"
                      ? "Escolher"
                      : node.state === "locked"
                        ? "!"
                        : node.kind === "ascension"
                          ? "★"
                          : "·"}
                </span>
              </Tag>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
