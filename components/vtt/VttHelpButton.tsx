"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

function HelpSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="vtt-help-section">
      <h4 className="vtt-help-section__title">{title}</h4>
      {children}
    </section>
  );
}

export function VttHelpButton() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        className="vtt-help-trigger"
        onClick={() => setOpen(true)}
        title="Dicas de jogo — como usar a mesa"
        aria-label="Dicas de jogo"
      >
        ?
      </button>
      {open ? (
        <div
          className="vtt-help-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vtt-help-title"
          onClick={close}
        >
          <div className="vtt-help-panel glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 id="vtt-help-title" className="vtt-help-panel__title">
              Dicas de jogo — Mesa Eldarin
            </h3>
            <p className="vtt-help-panel__lead">
              Guia rápido da interface. Use os ícones na coluna esquerda para abrir painéis; o mapa
              central é onde você move tokens, ataca e rola iniciativa.
            </p>

            <HelpSection title="Como abrir os painéis">
              <ul className="vtt-help-panel__list">
                <li>
                  <strong>Clique esquerdo</strong> no ícone → abre uma <em>janela flutuante</em>{" "}
                  (popup) sobre o mapa. Várias janelas podem ficar abertas; o sistema tenta não
                  sobrepor uma à outra.
                </li>
                <li>
                  <strong>Clique direito</strong> no ícone → abre o painel na <em>barra lateral</em>{" "}
                  fixa, ao lado dos ícones. Só um painel ocupa a barra por vez. Clique direito de
                  novo no mesmo ícone para fechar.
                </li>
                <li>
                  Janelas flutuantes podem ser <strong>arrastadas</strong> pela barra de título,
                  <strong> redimensionadas</strong> pelo canto inferior direito e fechadas com{" "}
                  <strong>×</strong>.
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Ícones — Jogo (todos os jogadores)">
              <ul className="vtt-help-panel__list">
                <li>
                  <strong>Tokens</strong> — personagens e monstros no mapa. Selecione na lista ou no
                  hex; veja vida, defesa e PA (quando visível). Botão <strong>Status</strong> abre
                  condições e buffs ativos no seu personagem (somente leitura para jogadores).
                </li>
                <li>
                  <strong>Turno</strong> — ordem de iniciativa, rodada atual e quem está na vez.
                  Banner no topo do mapa: <em>Turno de: [nome]</em>. Use <em>Passar turno</em> ao
                  terminar suas ações.
                </li>
                <li>
                  <strong>Ficha</strong> — lista de personagens jogáveis da aventura. Abra qualquer
                  ficha para consultar; só edite a sua. Crie personagens novos pelo link na lista.
                </li>
                <li>
                  <strong>Chat</strong> — mensagens da mesa e do combate (ataques, dano, PA). Todos
                  os participantes com acesso ao chat podem enviar texto.
                </li>
                <li>
                  <strong>Dados</strong> — rolador integrado; o resultado vai para o chat da sala.
                </li>
                <li>
                  <strong>Convite</strong> — link e código para outros jogadores entrarem na mesa
                  (quando disponível).
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Ícones — Mestre (só quem dirige a mesa)">
              <ul className="vtt-help-panel__list">
                <li>
                  <strong>Mapa</strong> — editor de cenário: subir imagem de fundo (piso), ajustar
                  escala/posição e colocar paredes/objetos que bloqueiam movimento. Atalho rápido:{" "}
                  botão <strong>Editor de mapa</strong> na barra de ferramentas à esquerda.
                </li>
                <li>
                  <strong>Mestre</strong> — configurações da sala (HP de monstros visível, bypass de
                  iniciativa, etc.), progresso de XP dos jogadores e criações do mestre (NPCs e
                  criaturas customizadas).
                </li>
                <li>
                  <strong>Invocar</strong> — arraste monstros do compêndio para o hex desejado no
                  mapa. Monstros entram na iniciativa quando o combate já está rolando.
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Combate e turnos">
              <ul className="vtt-help-panel__list">
                <li>
                  O mestre rola iniciativa no painel <strong>Turno</strong>. Quem está na vez tem
                  o token destacado com <strong>anel dourado</strong> no mapa.
                </li>
                <li>
                  No seu turno, <strong>clique direito</strong> no seu personagem ou no hex dele
                  para abrir o <strong>anel de ações</strong> (mover, atacar, magia, habilidade).
                </li>
                <li>
                  Passe o mouse sobre cada botão do anel para ver descrição, alcance, dano/cura e
                  custo em <strong>Pontos de Ação (PA)</strong>.
                </li>
                <li>
                  Escolha uma ação → o mapa entra em modo de <strong>alvo</strong> ou{" "}
                  <strong>movimento</strong> (hexes coloridos). Clique no alvo ou hex válido.{" "}
                  <kbd>Esc</kbd> cancela.
                </li>
                <li>
                  Magias de <strong>área</strong> pedem um clique no centro (e às vezes na direção
                  em um hex vizinho).
                </li>
                <li>
                  Ao terminar, clique em <em>Passar turno</em> (barra inferior). PA não gastos podem
                  acumular até o limite da ficha.
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Pontos de Ação (PA) e movimento">
              <ul className="vtt-help-panel__list">
                <li>
                  Ataques, magias e habilidades gastam <strong>PA</strong> (valor em cada ação no
                  anel ou compêndio).
                </li>
                <li>
                  <strong>Caminhada</strong> usa hexes gratuitos por turno; <strong>corrida</strong>{" "}
                  além disso pode gastar 1 PA. Hexes verdes/âmbar no mapa mostram onde você pode ir.
                </li>
                <li>
                  Ícones de <strong>condição/buff</strong> no token mostram efeitos ativos; passe o
                  mouse para ver a regra e a duração (ex.: <em>Inspirado: 2 turnos</em>).
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Status, condições e buffs">
              <ul className="vtt-help-panel__list">
                <li>
                  Botão <strong>Status</strong> (painel Tokens) — jogadores veem só o próprio
                  personagem; o mestre vê o token selecionado.
                </li>
                <li>
                  Lista apenas efeitos <strong>ativos agora</strong>. Hover mostra descrição completa
                  e tempo restante.
                </li>
                <li>
                  <strong>Jogadores não aplicam</strong> condições em si — isso é feito pelo mestre
                  na mesma tela de Status (seção &quot;Aplicar condições&quot;).
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Mapa, câmera e ferramentas (estilo Roll20)">
              <ul className="vtt-help-panel__list">
                <li>
                  Barra vertical à <strong>esquerda do mapa</strong>: <strong>Interagir</strong>{" "}
                  (padrão), <strong>Ping</strong>, <strong>Régua</strong>,{" "}
                  <strong>Névoa</strong> (mestre, com névoa ativa), <strong>Desenho</strong> e
                  controles de <strong>zoom</strong>.
                </li>
                <li>
                  <strong>Scroll do mouse</strong> — zoom. <strong>Alt + arrastar</strong> — mover a
                  câmera (em qualquer modo).
                </li>
                <li>
                  Modo <strong>Ping</strong> ou <strong>Alt + clique</strong> — marca posição para o
                  grupo (se permitido nas configurações).
                </li>
                <li>
                  Modo <strong>Régua</strong> — arraste no mapa para medir distância em hex e metros.
                  <kbd>Esc</kbd> limpa a medição.
                </li>
                <li>
                  Modo <strong>Névoa</strong> ou <strong>Ctrl + clique</strong> — revela hex (mestre).
                  Jogadores só veem tokens dentro do campo de visão.
                </li>
                <li>
                  Modo <strong>Desenho</strong> — traço livre, linha, seta, formas, polígono e texto
                  (temporário ou permanente). Painel <strong>Lousa</strong> na barra lateral para
                  opções extras. <kbd>Del</kbd> apaga desenho selecionado.
                </li>
                <li>
                  <strong>Mestre:</strong> botão <strong>Editor de mapa</strong> abre o construtor de cenário; arraste
                  tokens livremente para reposicionar.
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Ficha de personagem">
              <ul className="vtt-help-panel__list">
                <li>
                  Abra pela lista <strong>Ficha</strong> ou pelo link no painel Tokens. Popup da ficha
                  pode ser movido e redimensionado como os outros painéis.
                </li>
                <li>
                  Inventário separado (armas, equipamento, magias). Subir de nível pela aba dedicada
                  quando tiver XP suficiente.
                </li>
                <li>
                  Fichas de outros jogadores abrem em <strong>somente leitura</strong>.
                </li>
              </ul>
            </HelpSection>

            <HelpSection title="Atalhos úteis">
              <ul className="vtt-help-panel__list">
                <li>
                  <kbd>Esc</kbd> — cancela ataque/movimento/magia, régua ou volta ao modo Interagir.
                </li>
                <li>
                  <kbd>Delete</kbd> — mestre remove o token selecionado do mapa.
                </li>
                <li>
                  <kbd>Alt</kbd> + arrastar — mover câmera · <kbd>Alt</kbd> + clique — ping.
                </li>
                <li>
                  <kbd>Ctrl</kbd> + clique — revelar hex (névoa, mestre).
                </li>
              </ul>
            </HelpSection>

            <button type="button" className="btn vtt-help-panel__close" onClick={close}>
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
