import Link from "next/link";
import { ENTRAR_PATH, ELDARIN_MESAS_PATH, MESAS_HUB_PATH } from "@/lib/site-paths";
import {
  IconBook,
  IconChat,
  IconHome,
  IconMove,
  IconRun,
  IconScroll,
  IconSheet,
  IconShield,
  IconSword,
  IconUser,
} from "@/components/ui/EldarinIcons";
import { pageMetadata } from "@/lib/site-metadata";
import "./sistema.css";

export const metadata = pageMetadata("Como jogar");

const LIVE = [
  "Instalar como aplicativo no Chrome (atalho na área de trabalho)",
  "Mesa VTT ao vivo com sync SSE (fallback poll)",
  "Combate: PA, movimento, ataque, habilidade, magias de área (cone/linha)",
  "Preview no mapa: PA, alcance, vantagem/desvantagem",
  "Iniciativa, condições, spawn do bestiário (69 espécies)",
  "Wizard de ficha (8 passos, com religião) e compêndios sincronizados do livro",
  "Atlas e panteão em /mundo — lore com tooltips",
  "Convite de sala + modo visitante (só leitura)",
  "Login Clerk + apelido (opcional) ou demo local",
];

const NEXT = [
  "Persistência Neon em produção (salas e fichas na nuvem)",
  "Delegação explícita de token entre jogadores",
  "Névoa de guerra e macros",
];

const STEPS = [
  {
    title: "Crie sua conta",
    text: (
      <>
        Clique em <strong>Entrar</strong> no topo e faça login (Clerk) ou use o modo demo local.
        Na primeira vez, você pode escolher um apelido para aparecer na mesa.
      </>
    ),
    href: ENTRAR_PATH,
    linkLabel: "Entrar",
  },
  {
    title: "Monte seu personagem",
    text: (
      <>
        Use o assistente de ficha em oito passos: raça, classe, atributos, equipamento e magias.
        A ficha fica salva na sua conta e pode ser vinculada a uma aventura.
      </>
    ),
    href: "/personagem/novo",
    linkLabel: "Nova ficha",
  },
  {
    title: "Entre em uma mesa",
    text: (
      <>
        Em <strong>Suas mesas</strong>, crie uma aventura como mestre ou entre com o código que o
        mestre enviou. Mesas ingressadas ficam na sua conta.
      </>
    ),
    href: ELDARIN_MESAS_PATH,
    linkLabel: "Suas mesas",
  },
  {
    title: "Abra a sala VTT",
    text: (
      <>
        Na aventura, abra a mesa VTT. Compartilhe o link de convite para amigos entrarem como
        jogadores ou visitantes (somente leitura).
      </>
    ),
    href: "/mesa/demo",
    linkLabel: "Mesa demo",
  },
] as const;

const NAV_ITEMS = [
  {
    icon: IconHome,
    label: "Início",
    path: "/",
    text: "Página principal com visão geral do VTT e atalho para a demo.",
  },
  {
    icon: IconScroll,
    label: "Sistema",
    path: "/sistema",
    text: "Este guia — como jogar, navegar e o que já está disponível.",
  },
  {
    icon: IconBook,
    label: "Compêndios",
    path: "/compendios",
    text: "Magias, habilidades, monstros e regras do livro Eldarin v4, sempre sincronizados.",
  },
  {
    icon: IconUser,
    label: "Perfil",
    path: "/conta",
    text: "Foto, apelido, amigos e preferências da conta.",
  },
  {
    icon: IconChat,
    label: "Mensagens",
    path: null,
    text: "Chat privado com amigos — ícone no topo da barra, ao lado do perfil.",
  },
  {
    icon: IconShield,
    label: "Mesas",
    path: MESAS_HUB_PATH,
    text: "Hub MXDRPG — escolha o RPG e abra suas mesas.",
  },
  {
    icon: IconShield,
    label: "Eldarin",
    path: ELDARIN_MESAS_PATH,
    text: "Mesas do RPG Eldarin: aventuras, convites e sala VTT.",
  },
] as const;

const VTT_BASICS = [
  {
    icon: IconMove,
    title: "Tokens no mapa",
    text: "Personagens e monstros aparecem como tokens no grid. Selecione na lista ou no mapa para ver vida, defesa e PA. Quem está na vez tem anel dourado.",
  },
  {
    icon: IconMove,
    title: "Movimento",
    text: "No seu turno, clique direito no token para o anel de ações. Caminhada usa células gratuitas (verde); corrida além disso pode gastar 1 PA (âmbar). Esc para cancelar.",
  },
  {
    icon: IconSword,
    title: "Combate e PA",
    text: "Ataques, magias e habilidades gastam Pontos de Ação. Passe o mouse no anel para ver custo e alcance. Ao terminar, use Passar turno — PA não gastos podem acumular até o limite da ficha.",
  },
  {
    icon: IconSheet,
    title: "Ficha",
    text: "Abra pelo painel Ficha na mesa. Consulte a sua ou veja as dos colegas em somente leitura. Inventário, magias e subida de nível ficam na ficha popup.",
  },
  {
    icon: IconChat,
    title: "Chat e dados",
    text: "Mensagens da mesa e do combate (ataques, dano, PA) aparecem no chat. O rolador integrado envia resultados para todos.",
  },
  {
    icon: IconRun,
    title: "Ferramentas do mestre",
    text: "Quem dirige a mesa tem painéis extras: editor de mapa, invocar monstros do compêndio, iniciativa, condições nos tokens e configurações da sala.",
  },
] as const;

export default function SistemaPage() {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">Guia do jogador</p>
        <h1 className="display-lg text-gradient">Como jogar no Eldarin VTT</h1>
        <p className="lead">
          Do cadastro à mesa VTT: aprenda a navegar o site, entrar numa aventura e usar tokens,
          movimento e combate por Pontos de Ação — alinhado ao livro Eldarin v4.
        </p>
      </header>

      <section className="glass sistema-section" style={{ padding: "1.25rem 1.5rem" }}>
        <h2>Primeiros passos</h2>
        <p className="sistema-section__lead">
          Quatro etapas para sair do zero até a mesa ao vivo com seu personagem.
        </p>
        <ol className="sistema-steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="sistema-step">
              <span className="sistema-step__num" aria-hidden>
                {i + 1}
              </span>
              <div className="sistema-step__body">
                <h3>{step.title}</h3>
                <p>
                  {step.text}{" "}
                  <Link href={step.href}>{step.linkLabel}</Link>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass sistema-section" style={{ padding: "1.25rem 1.5rem" }}>
        <h2>Navegar o site</h2>
        <p className="sistema-section__lead">
          A barra superior concentra os atalhos principais. Use esta tabela como mapa mental.
        </p>
        <div className="sistema-nav-grid">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="sistema-nav-card">
                <div className="sistema-nav-card__head">
                  <span className="sistema-nav-card__icon" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <span className="sistema-nav-card__label">
                    {item.path ? (
                      <Link href={item.path}>{item.label}</Link>
                    ) : (
                      item.label
                    )}
                  </span>
                </div>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
        <p className="sistema-tip">
          <strong>Dica:</strong> dentro da mesa VTT, o botão <strong>?</strong> no canto abre um
          guia rápido da interface — painéis flutuantes, ícones da barra lateral e atalhos de
          teclado.
        </p>
      </section>

      <section className="glass sistema-section" style={{ padding: "1.25rem 1.5rem" }}>
        <h2>Na mesa VTT</h2>
        <p className="sistema-section__lead">
          O essencial do jogo tático: grid quadrado, turnos e fichas integradas ao combate.
        </p>
        <div className="sistema-vtt-grid">
          {VTT_BASICS.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="glass feature-card sistema-vtt-card">
                <div className="feature-icon">
                  <Icon size={26} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sistema-roadmap sistema-section">
        <div className="glass" style={{ padding: "1.25rem 1.5rem" }}>
          <h2>Jogável agora</h2>
          <ul className="roadmap-list roadmap-list--live">
            {LIVE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="glass" style={{ padding: "1.25rem 1.5rem" }}>
          <h2>Em seguida</h2>
          <ul className="roadmap-list roadmap-list--pending">
            {NEXT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="action-row" style={{ marginTop: "2rem" }}>
        <Link href="/mesa/demo" prefetch={false} className="btn">
          Mesa demo
        </Link>
        <Link href="/personagem/novo" className="btn btn-ghost">
          Nova ficha
        </Link>
        <Link href={MESAS_HUB_PATH} className="btn btn-ghost">
          Hub de mesas
        </Link>
        <Link href={ELDARIN_MESAS_PATH} className="btn btn-ghost">
          Eldarin
        </Link>
        <Link href="/compendios" className="btn btn-ghost">
          Compêndios
        </Link>
        <Link href="/aplicativo" className="btn btn-ghost">
          Instalar app
        </Link>
        <Link href="/mundo" className="btn btn-ghost">
          Atlas e panteão
        </Link>
      </div>
    </div>
  );
}
