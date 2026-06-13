"use client";

import { useEffect, useState } from "react";
import type { RoomSettings } from "@/lib/room/settings";
import type { RoomSnapshot } from "@/lib/room/types";
import { patchRoomSettings } from "@/hooks/useRoomSync";
import { RoomCoverEditor } from "@/components/vtt/RoomCoverEditor";
import {
  DEFAULT_PORTRAIT_FOCUS,
  portraitFocusToImgStyle,
  sanitizePortraitFocus,
} from "@/lib/media/portrait-focus";
import { getDefaultRpgCover } from "@/lib/rpg/systems";

type Props = {
  roomId: string;
  roomName: string;
  settings: RoomSettings;
  /** hub = página de gerenciamento; vtt = painel lateral na sala */
  coverVariant?: "hub" | "vtt";
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function RoomSettingsPanel({
  roomId,
  roomName,
  settings,
  coverVariant = "vtt",
  onUpdated,
}: Props) {
  const [name, setName] = useState(roomName);
  const [showMonsterHp, setShowMonsterHp] = useState(settings.showMonsterHpToPlayers);
  const [showMonsterHpChat, setShowMonsterHpChat] = useState(settings.showMonsterHpInChat);
  const [allowPing, setAllowPing] = useState(settings.allowPlayerPing);
  const [showUsernamePlate, setShowUsernamePlate] = useState(settings.showUsernameOnTokenNameplate);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const hubCoverPreview =
    settings.coverUrl?.trim() || getDefaultRpgCover();
  const hubCoverFocus =
    sanitizePortraitFocus(settings.coverFocus) ?? DEFAULT_PORTRAIT_FOCUS;

  useEffect(() => {
    setName(roomName);
    setShowMonsterHp(settings.showMonsterHpToPlayers);
    setShowMonsterHpChat(settings.showMonsterHpInChat);
    setAllowPing(settings.allowPlayerPing);
    setShowUsernamePlate(settings.showUsernameOnTokenNameplate);
  }, [roomName, settings]);

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await patchRoomSettings(roomId, {
        name: name.trim() || roomName,
        showMonsterHpToPlayers: showMonsterHp,
        showMonsterHpInChat: showMonsterHpChat,
        allowPlayerPing: allowPing,
        showUsernameOnTokenNameplate: showUsernamePlate,
        gmBypassInitiative: false,
      });
      onUpdated(snapshot);
      setMsg("Configurações salvas.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={
        coverVariant === "hub"
          ? "vtt-room-settings vtt-room-settings--hub"
          : "vtt-map-panel vtt-room-settings"
      }
    >
      <p className="vtt-eyebrow">Configuração da mesa</p>
      <p className="vtt-combat-hint" style={{ marginTop: 0 }}>
        Você é o mestre desta sala. O convite fica no painel <strong>Convite</strong> da barra lateral.
      </p>

      <label className="vtt-field">
        <span>Nome da campanha</span>
        <input
          type="text"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      {coverVariant === "hub" ? (
        <fieldset className="vtt-settings-fieldset mesa-cover-hub-control">
          <legend className="vtt-eyebrow">Capa da mesa</legend>
          {coverEditorOpen ? (
            <>
              <RoomCoverEditor
                roomId={roomId}
                coverUrl={settings.coverUrl}
                coverFocus={settings.coverFocus}
                variant="hub"
                onUpdated={(snap) => {
                  onUpdated(snap);
                }}
              />
              <div className="vtt-map-panel-actions" style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="vtt-btn vtt-btn--ghost"
                  onClick={() => setCoverEditorOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="vtt-combat-hint" style={{ margin: 0 }}>
                Miniatura em <strong>Suas mesas</strong> e fundo discreto na sala VTT. Sem capa
                personalizada, usamos a imagem padrão do Eldarin.
              </p>
              <div className="mesa-room-cover-preview mesa-room-cover-preview--hub mesa-room-cover-preview--has-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hubCoverPreview}
                  alt=""
                  className="mesa-room-cover-preview__img"
                  style={portraitFocusToImgStyle(hubCoverFocus)}
                />
              </div>
              <div className="vtt-map-panel-actions mesa-cover-hub-control__actions">
                <button
                  type="button"
                  className="vtt-btn vtt-btn--ghost"
                  onClick={() => setCoverEditorOpen(true)}
                >
                  Alterar capa
                </button>
              </div>
            </>
          )}
        </fieldset>
      ) : null}

      <fieldset className="vtt-settings-fieldset">
        <legend className="vtt-eyebrow">Visibilidade para jogadores</legend>
        <label className="vtt-check">
          <input
            type="checkbox"
            checked={showMonsterHp}
            onChange={(e) => setShowMonsterHp(e.target.checked)}
          />
          Exibir HP dos monstros (tokens e ordem de turno)
        </label>
        <label className="vtt-check">
          <input
            type="checkbox"
            checked={showMonsterHpChat}
            onChange={(e) => setShowMonsterHpChat(e.target.checked)}
          />
          Exibir HP de monstros no chat de combate
        </label>
      </fieldset>

      <fieldset className="vtt-settings-fieldset">
        <legend className="vtt-eyebrow">Combate</legend>
        <p className="vtt-combat-hint" style={{ margin: 0 }}>
          Você pode rolar iniciativa, reordenar a fila e passar turnos. Mover, atacar e usar magia só na
          vez de cada token (personagens e monstros).
        </p>
      </fieldset>

      <fieldset className="vtt-settings-fieldset">
        <legend className="vtt-eyebrow">Tokens no mapa</legend>
        <label className="vtt-check">
          <input
            type="checkbox"
            checked={showUsernamePlate}
            onChange={(e) => setShowUsernamePlate(e.target.checked)}
          />
          Exibir username + ficha em duas linhas (sem parênteses)
        </label>
        <p className="vtt-combat-hint" style={{ margin: 0 }}>
          Personagens de jogador mostram apelido na primeira linha e nome da ficha abaixo. Monstros
          mantêm só o nome. Com a opção ativa, a placa aparece ao passar o mouse; use
          &quot;sempre visível&quot; no token para fixar.
        </p>
      </fieldset>

      <fieldset className="vtt-settings-fieldset">
        <legend className="vtt-eyebrow">Ferramentas</legend>
        <label className="vtt-check">
          <input
            type="checkbox"
            checked={allowPing}
            onChange={(e) => setAllowPing(e.target.checked)}
          />
          Jogadores podem usar ping no mapa (Alt+clique)
        </label>
      </fieldset>

      <div className="vtt-map-panel-actions">
        <button type="button" className="vtt-btn" disabled={busy} onClick={() => void save()}>
          Salvar configurações
        </button>
      </div>
      {msg ? <p className="vtt-combat-hint">{msg}</p> : null}
    </div>
  );
}
