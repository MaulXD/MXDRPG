"use client";

/**
 * Polling que so roda com a aba visivel (mesmo padrao de P-01 em FriendsChatProvider).
 * Pausa ao esconder a aba; ao voltar, faz uma leitura e retoma o intervalo.
 * O primeiro disparo fica por conta de quem chama (o effect ja le ao montar).
 * Devolve a funcao de limpeza do effect.
 */
export function startVisiblePoll(run: () => void, ms: number): () => void {
  let timer: number | null = null;
  const stop = () => {
    if (timer != null) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    if (timer == null) timer = window.setInterval(run, ms);
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      stop();
      return;
    }
    if (timer == null) {
      run();
      start();
    }
  };
  if (document.visibilityState !== "hidden") start();
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
