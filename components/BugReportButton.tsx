"use client";

import { IconBug } from "@/components/ui/EldarinIcons";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildBugScreenshotFromFile } from "@/lib/media/image-upload-client";
import { IMAGE_UPLOAD_HINT } from "@/lib/media/image-data-url";
import "@/components/bug-report.css";

type Props = {
  /** Variante visual na mesa VTT (canto inferior, acima de outros controles). */
  variant?: "site" | "vtt";
};

export function BugReportButton({ variant = "site" }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const descId = useId();
  const fileId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = useCallback(() => {
    setDescription("");
    setScreenshot(null);
    setScreenshotName(null);
    setError(null);
    setSuccess(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    resetForm();
  }, [busy, resetForm]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, close]);

  async function onPickFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await buildBugScreenshotFromFile(file);
      setScreenshot(dataUrl);
      setScreenshotName(file.name);
    } catch (e) {
      setScreenshot(null);
      setScreenshotName(null);
      setError(e instanceof Error ? e.message : "Falha ao processar imagem");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const text = description.trim();
    if (text.length < 10) {
      setError("Descreva o bug com pelo menos 10 caracteres.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/bugs/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: text,
          screenshotDataUrl: screenshot,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível enviar o relato");
      }
      setSuccess(data.message ?? "Relato enviado. Obrigado!");
      setTimeout(() => close(), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setBusy(false);
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="bug-report-backdrop"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && !busy) close();
            }}
          >
            <div
              className="bug-report-modal glass-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bug-report-title"
            >
              <h2 id="bug-report-title" className="bug-report-modal__title">
                Reportar bug
              </h2>
              <p className="bug-report-modal__lead">
                Conte o que aconteceu e, se puder, anexe uma captura de tela. Enviamos URL da página
                e navegador automaticamente para facilitar a correção.
              </p>

              {success ? (
                <p className="bug-report-modal__success" role="status">
                  {success}
                </p>
              ) : (
                <form className="bug-report-form" onSubmit={(ev) => void onSubmit(ev)}>
                  <label className="bug-report-field" htmlFor={descId}>
                    <span>Descrição</span>
                    <textarea
                      id={descId}
                      value={description}
                      onChange={(ev) => setDescription(ev.target.value)}
                      placeholder="Ex.: Ao atacar com magia de área, o jogo travou e não passou o turno…"
                      rows={5}
                      maxLength={4000}
                      disabled={busy}
                      required
                    />
                    <span className="bug-report-field__hint">{description.trim().length}/4000</span>
                  </label>

                  <div className="bug-report-field">
                    <span id={fileId}>Captura de tela (opcional)</span>
                    <div className="bug-report-file-row">
                      <input
                        ref={fileRef}
                        id={`${fileId}-input`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={busy}
                        aria-labelledby={fileId}
                        onChange={(ev) => void onPickFile(ev.target.files?.[0] ?? null)}
                      />
                      {screenshot ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotName(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                        >
                          Remover imagem
                        </button>
                      ) : null}
                    </div>
                    <span className="bug-report-field__hint">{IMAGE_UPLOAD_HINT}</span>
                    {screenshotName ? (
                      <span className="bug-report-field__hint">Arquivo: {screenshotName}</span>
                    ) : null}
                    {screenshot ? (
                      <div className="bug-report-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={screenshot} alt="Pré-visualização do anexo" />
                      </div>
                    ) : null}
                  </div>

                  {error ? (
                    <p className="bug-report-modal__error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="bug-report-modal__actions">
                    <button type="button" className="btn btn-ghost" disabled={busy} onClick={close}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary-cta" disabled={busy}>
                      {busy ? "Enviando…" : "Enviar relato"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={`bug-report-fab bug-report-fab--${variant}`}
        onClick={() => setOpen(true)}
        title="Reportar bug"
        aria-label="Reportar bug"
      >
        <span className="bug-report-fab__icon" aria-hidden>
          <IconBug size={18} />
        </span>
        <span className="bug-report-fab__label">Bug</span>
      </button>
      {modal}
    </>
  );
}
