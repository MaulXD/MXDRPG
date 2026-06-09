"use client";

import "./avatar-profile.css";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  initialNickname: string;
  /** Após salvar com sucesso, navega para este caminho (ex.: onboarding de apelido). */
  redirectAfterSave?: string;
};

export function NicknameForm({ initialNickname, redirectAfterSave }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (busy) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      setMsg("Informe um apelido.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar apelido");
      if (redirectAfterSave) {
        router.push(redirectAfterSave);
        router.refresh();
        return;
      }
      setMsg("Apelido salvo.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar apelido");
    } finally {
      setBusy(false);
    }
  }, [busy, nickname, redirectAfterSave, router]);

  return (
    <div className="nickname-form">
      <label className="vtt-field">
        <span>Apelido</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoComplete="username"
          maxLength={32}
          disabled={busy}
        />
      </label>
      <div className="nickname-form__actions">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void save()}>
          Salvar apelido
        </button>
      </div>
      {msg ? <p className="vtt-combat-hint">{msg}</p> : null}
    </div>
  );
}
