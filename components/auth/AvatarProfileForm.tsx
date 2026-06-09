"use client";

import "./avatar-profile.css";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useCallback, useEffect, useState } from "react";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import { readAvatarImageFile } from "@/lib/media/image-upload-client";
import {
  DEFAULT_PORTRAIT_FOCUS,
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
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
  const [focus, setFocus] = useState<PortraitFocus>(
    initialUser.avatarFocus ?? DEFAULT_PORTRAIT_FOCUS
  );
  const [editorSrc, setEditorSrc] = useState<string | null>(
    initialUser.avatarSource === "custom" && initialUser.avatarUrl ? initialUser.avatarUrl : null
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setAvatarSource(initialUser.avatarSource === "custom" ? "custom" : "oauth");
    setCustomUrl(initialUser.avatarSource === "custom" ? (initialUser.avatarUrl ?? "") : "");
    setFocus(initialUser.avatarFocus ?? DEFAULT_PORTRAIT_FOCUS);
    setEditorSrc(
      initialUser.avatarSource === "custom" && initialUser.avatarUrl ? initialUser.avatarUrl : null
    );
  }, [initialUser]);

  const previewUrl =
    avatarSource === "oauth"
      ? initialUser.oauthAvatarUrl ?? initialUser.avatarUrl ?? null
      : customUrl || editorSrc;

  const previewFocus = avatarSource === "custom" ? focus : null;

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
          avatarUrl: avatarSource === "custom" ? customUrl || editorSrc : null,
          avatarFocus: avatarSource === "custom" ? normalizePortraitFocus(focus) : null,
        }),
      });
      const data = (await res.json()) as { error?: string; user?: SessionUser };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      if (data.user?.avatarUrl && avatarSource === "custom") {
        setCustomUrl(data.user.avatarUrl);
        setEditorSrc(data.user.avatarUrl);
      }
      setMsg("Foto salva.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }, [avatarSource, busy, customUrl, editorSrc, focus]);

  async function onFileChange(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await readAvatarImageFile(file);
      setCustomUrl(dataUrl);
      setEditorSrc(dataUrl);
      setFocus(DEFAULT_PORTRAIT_FOCUS);
      setAvatarSource("custom");
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Arquivo inválido");
    }
  }

  return (
    <div className="avatar-profile-form">
      <div className="avatar-profile-form__preview">
        <UserAvatar
          url={previewUrl}
          focus={previewFocus}
          label={initialUser.nickname || initialUser.name}
          className="avatar-profile-form__preview-avatar"
        />
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
                const v = e.target.value;
                setCustomUrl(v);
                setEditorSrc(v.trim() || null);
                setFocus(DEFAULT_PORTRAIT_FOCUS);
              }}
            />
          </label>
          <label className="vtt-field">
            <span>Ou enviar arquivo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="vtt-combat-hint">{IMAGE_UPLOAD_HINT} · até ~8 MB no envio</p>

          {editorSrc ? (
            <div className="avatar-profile-form__editor">
              <PortraitFocusEditor
                imageSrc={editorSrc}
                focus={focus}
                onFocusChange={setFocus}
                previewMode="portrait"
                disabled={busy}
              />
            </div>
          ) : null}
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
