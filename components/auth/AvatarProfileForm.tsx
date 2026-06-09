"use client";

import { useCallback, useEffect, useState } from "react";
import { fileToDataUrl, IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import type { SessionUser } from "@/lib/auth/types";

type Props = {
  initialUser: SessionUser;
};

export function AvatarProfileForm({ initialUser }: Props) {
  const [avatarSource, setAvatarSource] = useState<"oauth" | "custom">(
    initialUser.avatarSource === "custom" ? "custom" : "oauth"
  );
  const [customUrl, setCustomUrl] = useState(
    initialUser.avatarSource === "custom" ? (initialUser.avatarUrl ?? "") : ""
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUser.avatarUrl ?? null);

  useEffect(() => {
    setAvatarSource(initialUser.avatarSource === "custom" ? "custom" : "oauth");
    setCustomUrl(initialUser.avatarSource === "custom" ? (initialUser.avatarUrl ?? "") : "");
    setPreview(initialUser.avatarUrl ?? null);
  }, [initialUser]);

  useEffect(() => {
    if (avatarSource === "oauth") {
      setPreview(initialUser.oauthAvatarUrl ?? initialUser.avatarUrl ?? null);
    } else if (customUrl) {
      setPreview(customUrl);
    }
  }, [avatarSource, customUrl, initialUser.oauthAvatarUrl, initialUser.avatarUrl]);

  const save = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          avatarSource,
          avatarUrl: avatarSource === "custom" ? customUrl : null,
        }),
      });
      const data = (await res.json()) as { error?: string; user?: SessionUser };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      if (data.user?.avatarUrl) setPreview(data.user.avatarUrl);
      setMsg("Foto salva.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }, [avatarSource, busy, customUrl]);

  async function onFileChange(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setCustomUrl(dataUrl);
      setPreview(dataUrl);
      setAvatarSource("custom");
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Arquivo inválido");
    }
  }

  return (
    <div className="avatar-profile-form">
      <div className="avatar-profile-form__preview">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="avatar-profile-form__img" />
        ) : (
          <span className="avatar-profile-form__fallback">
            {(initialUser.nickname || initialUser.name).slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <fieldset className="avatar-profile-form__source">
        <legend className="eyebrow">Foto de perfil</legend>
        <label className="avatar-profile-form__radio">
          <input
            type="radio"
            name="avatarSource"
            checked={avatarSource === "oauth"}
            onChange={() => setAvatarSource("oauth")}
          />
          Usar foto do login (Google / Clerk)
        </label>
        <label className="avatar-profile-form__radio">
          <input
            type="radio"
            name="avatarSource"
            checked={avatarSource === "custom"}
            onChange={() => setAvatarSource("custom")}
          />
          Foto personalizada
        </label>
      </fieldset>

      {avatarSource === "custom" ? (
        <div className="avatar-profile-form__custom">
          <label className="vtt-field">
            <span>URL da imagem</span>
            <input
              type="url"
              value={customUrl.startsWith("data:") ? "" : customUrl}
              placeholder="https://…"
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setPreview(e.target.value.trim() || null);
              }}
            />
          </label>
          <label className="vtt-field">
            <span>Ou enviar arquivo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="vtt-combat-hint">{IMAGE_UPLOAD_HINT}</p>
        </div>
      ) : null}

      <div className="avatar-profile-form__actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
          Salvar foto
        </button>
      </div>
      {msg ? <p className="vtt-combat-hint">{msg}</p> : null}
    </div>
  );
}
