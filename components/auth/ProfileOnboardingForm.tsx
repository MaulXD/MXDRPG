"use client";

import "./avatar-profile.css";
import { nicknameAvatarUrl } from "@/lib/avatar/nickname-avatar";
import { validateNickname } from "@/lib/auth/nickname";
import { PortraitFocusEditor } from "@/components/character/PortraitFocusEditor";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import { readAvatarImageFile } from "@/lib/media/image-upload-client";
import {
  DEFAULT_PORTRAIT_FOCUS,
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";
import type { SessionUser } from "@/lib/auth/types";
import type { AvatarSource } from "@/lib/db/user-avatar";

type Props = {
  initialUser: SessionUser;
  redirectAfter: string;
};

function defaultAvatarSource(user: SessionUser): AvatarSource {
  if (user.oauthAvatarUrl?.trim()) return "oauth";
  return "generated";
}

export function ProfileOnboardingForm({ initialUser, redirectAfter }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [avatarSource, setAvatarSource] = useState<AvatarSource>(defaultAvatarSource(initialUser));
  const [customUrl, setCustomUrl] = useState("");
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [focus, setFocus] = useState<PortraitFocus>(DEFAULT_PORTRAIT_FOCUS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const nicknameValid = useMemo(() => {
    const trimmed = nickname.trim();
    if (!trimmed) return null;
    return validateNickname(trimmed);
  }, [nickname]);

  const previewUrl = useMemo(() => {
    if (avatarSource === "oauth") {
      return initialUser.oauthAvatarUrl ?? initialUser.avatarUrl ?? null;
    }
    if (avatarSource === "generated") {
      if (nicknameValid?.ok) return nicknameAvatarUrl(nicknameValid.nickname);
      return null;
    }
    return customUrl || editorSrc;
  }, [avatarSource, customUrl, editorSrc, initialUser, nicknameValid]);

  const previewFocus = avatarSource === "custom" ? focus : null;

  const submit = useCallback(async () => {
    if (busy) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      setMsg("Informe um apelido — é obrigatório no primeiro acesso.");
      return;
    }
    const v = validateNickname(trimmed);
    if (!v.ok) {
      setMsg(v.error);
      return;
    }
    if (avatarSource === "custom" && !(customUrl || editorSrc)) {
      setMsg("Envie uma foto ou informe uma URL.");
      return;
    }
    if (avatarSource === "oauth" && !initialUser.oauthAvatarUrl?.trim()) {
      setMsg("Sem foto do Google — escolha avatar sugerido ou envie uma imagem.");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nickname: v.nickname,
          avatarSource,
          avatarUrl: avatarSource === "custom" ? customUrl || editorSrc : null,
          avatarFocus: avatarSource === "custom" ? normalizePortraitFocus(focus) : null,
          redirect: redirectAfter,
        }),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar perfil");
      router.push(data.redirect ?? redirectAfter);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar perfil");
    } finally {
      setBusy(false);
    }
  }, [
    avatarSource,
    busy,
    customUrl,
    editorSrc,
    focus,
    initialUser.oauthAvatarUrl,
    nickname,
    redirectAfter,
    router,
  ]);

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

  const hasOAuthPhoto = Boolean(initialUser.oauthAvatarUrl?.trim());

  return (
    <div className="avatar-profile-form profile-onboarding">
      <label className="vtt-field">
        <span>Apelido (obrigatório)</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoComplete="username"
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_\-]{3,24}"
          disabled={busy}
          placeholder="ex: raul_mestre"
          autoFocus
        />
      </label>
      <p className="vtt-combat-hint" style={{ marginTop: "0.35rem" }}>
        3–24 caracteres: letras, números, _ ou -. Aparece na mesa e para amigos.
      </p>

      <div className="avatar-profile-form__header" style={{ marginTop: "1.25rem" }}>
        <div className="avatar-profile-form__preview">
          <UserAvatar
            url={previewUrl}
            focus={previewFocus}
            label={nicknameValid?.ok ? nicknameValid.nickname : initialUser.name}
            className="avatar-profile-form__preview-avatar"
          />
        </div>

        <fieldset className="avatar-profile-form__source">
          <legend className="eyebrow">Foto de perfil</legend>
          {hasOAuthPhoto ? (
            <label className="avatar-profile-form__radio">
              <input
                type="radio"
                name="onboardAvatar"
                checked={avatarSource === "oauth"}
                onChange={() => setAvatarSource("oauth")}
              />
              <span>Usar foto do Google</span>
            </label>
          ) : null}
          <label className="avatar-profile-form__radio">
            <input
              type="radio"
              name="onboardAvatar"
              checked={avatarSource === "generated"}
              onChange={() => setAvatarSource("generated")}
            />
            <span>Avatar sugerido (do apelido)</span>
          </label>
          <label className="avatar-profile-form__radio">
            <input
              type="radio"
              name="onboardAvatar"
              checked={avatarSource === "custom"}
              onChange={() => setAvatarSource("custom")}
            />
            <span>Enviar minha foto</span>
          </label>
        </fieldset>
      </div>

      {avatarSource === "generated" ? (
        <p className="vtt-combat-hint">
          Ilustração única gerada a partir do apelido — muda se você trocar o apelido depois em{" "}
          <strong>Conta</strong>.
        </p>
      ) : null}

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
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
          {busy ? "Salvando…" : "Continuar para o MXDRPG"}
        </button>
      </div>
      {msg ? (
        <p className="auth-form__error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
