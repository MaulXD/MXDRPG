"use client";

import { useCallback, useEffect, useState } from "react";

type MemberOption = {
  userId: string;
  nickname: string | null;
  name: string;
  isOwner: boolean;
};

type Props = {
  open: boolean;
  mode: "delete" | "transfer";
  characterId: string;
  characterName: string;
  adventureId: string;
  roomId?: string;
  asGm?: boolean;
  excludeUserId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function CharacterManageDialog({
  open,
  mode,
  characterId,
  characterName,
  adventureId,
  roomId,
  asGm = false,
  excludeUserId,
  onClose,
  onSuccess,
}: Props) {
  const [confirmName, setConfirmName] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const exclude = excludeUserId ? `?exclude=${encodeURIComponent(excludeUserId)}` : "";
    const res = await fetch(`/api/adventures/${adventureId}/members${exclude}`);
    if (!res.ok) {
      setMembers([]);
      setTargetUserId("");
      return;
    }
    const data = (await res.json()) as { members?: MemberOption[] };
    const list = data.members ?? [];
    setMembers(list);
    setTargetUserId((prev) => {
      if (list.some((m) => m.userId === prev)) return prev;
      return list[0]?.userId ?? "";
    });
  }, [adventureId, excludeUserId]);

  useEffect(() => {
    if (!open) return;
    setConfirmName("");
    setTargetUserId("");
    setError(null);
    if (mode === "transfer") void loadMembers();
  }, [open, mode, loadMembers]);

  if (!open) return null;

  const needsConfirm = mode === "delete" || (!asGm && mode === "transfer");
  const title = mode === "delete" ? "Excluir personagem" : "Transferir personagem";
  const actionLabel = mode === "delete" ? "Excluir permanentemente" : "Transferir ficha";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "delete") {
        const res = await fetch(`/api/characters/${characterId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmName, roomId }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Falha ao excluir");
      } else {
        const res = await fetch(`/api/characters/${characterId}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmName: needsConfirm ? confirmName : undefined,
            targetUserId,
            roomId,
            asGm,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Falha ao transferir");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vtt-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="vtt-modal-panel glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="char-manage-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="char-manage-title" className="vtt-modal-title">
          {title}
        </h3>
        <p className="vtt-modal-lead">
          {mode === "delete"
            ? `Esta ação remove "${characterName}" da aventura e não pode ser desfeita.`
            : `Passar "${characterName}" para outro jogador desta mesa.`}
        </p>

        <form onSubmit={handleSubmit} className="vtt-form-stack">
          {mode === "transfer" ? (
            <label className="vtt-field">
              <span>Novo jogador</span>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.nickname ? `@${m.nickname}` : m.name}
                    {m.isOwner ? " (mestre)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {needsConfirm ? (
            <label className="vtt-field">
              <span>
                Digite <strong>{characterName}</strong> para confirmar
              </span>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={characterName}
                required
                autoComplete="off"
              />
            </label>
          ) : null}

          {error ? <p className="vtt-error">{error}</p> : null}

          <div className="vtt-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn ${mode === "delete" ? "btn-primary" : "btn-secondary"}`}
              disabled={
                loading ||
                (needsConfirm && !confirmName.trim()) ||
                (mode === "transfer" && (!targetUserId || members.length === 0))
              }
            >
              {loading ? "Aguarde…" : actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
