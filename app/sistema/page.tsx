import Link from "next/link";
import { RpgSystemContentTabs } from "@/components/rpg/RpgSystemContentTabs";
import { ENTRAR_PATH, ELDARIN_MESAS_PATH, MESAS_HUB_PATH } from "@/lib/site-paths";
import { UM_ANEL_MESAS_PATH, normalizeRpgSystemId } from "@/lib/rpg/systems";
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

type Props = {
  searchParams: Promise<{ sistema?: string }>;
};

const ELDARIN_LIVE = [
  "Instalar como aplicativo no Chrome (atalho na área de trabalho)",
  "Mesa VTT ao vivo com sync SSE (fallback poll)",
  "Combate: PA, movimento, ataque, habilidade, magias de área (cone/linha)",
  "Preview no mapa: PA, alcance, vantagem/desvantagem",
  "Iniciativa, condições, spawn do bestiário (69 espécies)",
  "Wizard de ficha (8 passos, com religião) e compêndios sincronizados do livro",
  "Atlas e panteão em /mundo — lore com tooltips",
  "Convite de sala + modo visitante (só leitura)",
  "Login Google + e-mail/senha",
];

const ELDARIN_NEXT = [
  "Persistência Neon em produção (salas e fichas na nuvem)",
  "Delegação explícita de token entre jogadores",
  "Névoa de guerra e macros",
];

const ELDARIN_STEPS = [
  {
    title: "Crie sua conta",
    text: (
      <>
        Clique em <strong>Entrar</strong> no topo e faça login com Google ou e-mail/senha.
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
    href: ELDARIN_MESAS_PATH,
    linkLabel: "Suas mesas",
  },
] as const;

const ELDARIN_NAV_ITEMS = [
  {
    icon: IconHome,
    label: "Início",
    path: "/",
    text: "Página principal com visão geral do hub MXDRPG.",
  },
  {
    icon: IconScroll,
    label: "Sistema",
    path: "/sistema",
    text: "Este guia — como jogar, navegar e o que já está disponível no Eldarin.",
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
    text: "Hub MXDRPG — escolha o sistema de RPG e abra suas mesas.",
  },
  {
    icon: IconShield,
    label: "Eldarin",
    path: ELDARIN_MESAS_PATH,
    text: "Mesas do sistema Eldarin: aventuras, convites e sala VTT.",
  },
] as const;

const ELDARIN_VTT_BASICS = [
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

const UM_ANEL_LIVE = [
  "Mesa VTT tática com mapa em grid — ordem de turno pela posição no mapa, sem rolagem de iniciativa",
  "Combate com a matemática do livro: Dado de Proeza (d12) + Dados de Sucesso (d6), Golpe Perfurante e Feridas",
  "Assistente de ficha em 9 passos: Cultura (7, incl. Altos-Elfos de Valfenda), Vocação, atributos, Perícias e Equipamento de Guerra",
  "Retrato e token com recorte, igual ao Eldarin",
  "Compêndio completo: bestiário (22 adversários), Tesouro/Bênçãos/Itens Amaldiçoados, Virtudes Culturais, Patronos, Coisas Sem Nome, Marcos e os 8 pré-gerados do Starter Set",
  "Chat com o ícone do Dado de Proeza (d12) nas rolagens de Perícia e ataque",
  "Convite de sala + modo visitante (só leitura)",
  "Login Google + e-mail/senha",
];

const UM_ANEL_NEXT = [
  "Posturas de Combate e Dano Especial completo (Golpe Pesado, Aparar, Investida de Escudo)",
  "Engajamento por contagem — hoje qualquer token ataca qualquer outro dentro do alcance da arma",
  "Fase de Companhia (Empreitadas) mecanizada — hoje é referência de compêndio, aplicada manualmente pelo Mestre",
  "Jornada (hex-crawl de Eriador)",
];

const UM_ANEL_STEPS = [
  {
    title: "Crie sua conta",
    text: (
      <>
        Clique em <strong>Entrar</strong> no topo e faça login com Google ou e-mail/senha.
        Na primeira vez, você pode escolher um apelido para aparecer na mesa.
      </>
    ),
    href: ENTRAR_PATH,
    linkLabel: "Entrar",
  },
  {
    title: "Crie ou entre numa aventura",
    text: (
      <>
        Em <strong>Suas mesas</strong>, crie uma aventura do Um Anel como mestre ou entre com o
        código que o mestre enviou.
      </>
    ),
    href: UM_ANEL_MESAS_PATH,
    linkLabel: "Suas mesas",
  },
  {
    title: "Monte seu aventureiro",
    text: (
      <>
        Dentro da aventura, use o assistente de 9 passos: Cultura, Vocação, atributos, Perícias e
        Equipamento de Guerra. A ficha fica salva na sua conta.
      </>
    ),
    href: UM_ANEL_MESAS_PATH,
    linkLabel: "Suas mesas",
  },
  {
    title: "Abra a sala VTT",
    text: (
      <>
        Na aventura, abra a mesa VTT. Compartilhe o link de convite para os jogadores colocarem o
        aventureiro no mapa; o Mestre invoca adversários direto do bestiário.
      </>
    ),
    href: UM_ANEL_MESAS_PATH,
    linkLabel: "Suas mesas",
  },
] as const;

const UM_ANEL_NAV_ITEMS = [
  {
    icon: IconHome,
    label: "Início",
    path: "/",
    text: "Página principal com visão geral do hub MXDRPG.",
  },
  {
    icon: IconScroll,
    label: "Sistema",
    path: "/sistema?sistema=um-anel",
    text: "Este guia — como jogar, navegar e o que já está disponível no Um Anel.",
  },
  {
    icon: IconBook,
    label: "Compêndios",
    path: "/compendios?sistema=um-anel",
    text: "Culturas, bestiário, Tesouro, Marcos e demais regras da 2ª edição, sempre sincronizados.",
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
    text: "Hub MXDRPG — escolha o sistema de RPG e abra suas mesas.",
  },
  {
    icon: IconShield,
    label: "O Um Anel",
    path: UM_ANEL_MESAS_PATH,
    text: "Mesas do sistema O Um Anel: aventuras, convites e sala VTT.",
  },
] as const;

const UM_ANEL_VTT_BASICS = [
  {
    icon: IconMove,
    title: "Tokens no mapa",
    text: "Aventureiros e adversários aparecem como tokens no grid. Selecione pra ver Resistência, Bloqueio e Proteção. Quem está na vez tem anel dourado.",
  },
  {
    icon: IconMove,
    title: "Movimento",
    text: "No seu turno, clique e mova o token pelo mapa — o Um Anel não usa Pontos de Ação, o combate é posicional.",
  },
  {
    icon: IconSword,
    title: "Combate",
    text: "Atacar abre um popup próprio: escolha a arma equipada e o alvo. O motor resolve Dado de Proeza + Dados de Sucesso, Golpe Perfurante e Ferida automaticamente.",
  },
  {
    icon: IconSheet,
    title: "Ficha",
    text: "Abra pelo painel Personagens jogáveis. Resistência, Esperança, Sombra e Fadiga ficam sempre visíveis, com ajuste direto na ficha popup.",
  },
  {
    icon: IconChat,
    title: "Chat e dados",
    text: "Rolagens de Perícia e ataques aparecem no chat com o resultado narrativo completo e o ícone do Dado de Proeza (d12).",
  },
  {
    icon: IconRun,
    title: "Ferramentas do mestre",
    text: "Invoque adversários do bestiário completo, consulte Coisas Sem Nome pra criar um monstro único, e Marcos/Patronos direto no compêndio da mesa.",
  },
] as const;

export default async function SistemaPage({ searchParams }: Props) {
  const { sistema } = await searchParams;
  const systemId = normalizeRpgSystemId(sistema);
  const isTor = systemId === "um-anel";

  const STEPS = isTor ? UM_ANEL_STEPS : ELDARIN_STEPS;
  const NAV_ITEMS = isTor ? UM_ANEL_NAV_ITEMS : ELDARIN_NAV_ITEMS;
  const VTT_BASICS = isTor ? UM_ANEL_VTT_BASICS : ELDARIN_VTT_BASICS;
  const LIVE = isTor ? UM_ANEL_LIVE : ELDARIN_LIVE;
  const NEXT = isTor ? UM_ANEL_NEXT : ELDARIN_NEXT;
  const novaFichaHref = isTor ? UM_ANEL_MESAS_PATH : "/personagem/novo";
  const sistemaHref = isTor ? ELDARIN_MESAS_PATH : UM_ANEL_MESAS_PATH;
  const sistemaLabel = isTor ? "Eldarin" : "O Um Anel";

  return (
    <div className="page-wrap">
      <RpgSystemContentTabs current={systemId} basePath="/sistema" />
      <header className="page-header">
        <p className="eyebrow">Guia do jogador · hub MXDRPG</p>
        <h1 className="display-lg text-gradient">
          Como jogar {isTor ? "O Um Anel" : "Eldarin"} no MXDRPG
        </h1>
        <p className="lead">
          {isTor
            ? "Do cadastro à mesa VTT: aprenda a navegar o site, entrar numa aventura e usar tokens, movimento e combate por Dado de Proeza — alinhado à 2ª edição de The One Ring."
            : "Do cadastro à mesa VTT: aprenda a navegar o site, entrar numa aventura e usar tokens, movimento e combate por Pontos de Ação — alinhado ao livro Eldarin v4."}
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
          {isTor
            ? "O essencial do jogo tático do Um Anel: grid quadrado, turnos por posição e ficha integrada ao combate."
            : "O essencial do jogo tático: grid quadrado, turnos e fichas integradas ao combate."}
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
        <Link href={novaFichaHref} className="btn btn-ghost">
          {isTor ? "Suas mesas" : "Nova ficha"}
        </Link>
        <Link href={MESAS_HUB_PATH} className="btn btn-ghost">
          Hub de mesas
        </Link>
        <Link href={sistemaHref} className="btn btn-ghost">
          {sistemaLabel}
        </Link>
        <Link href={isTor ? "/compendios?sistema=um-anel" : "/compendios"} className="btn btn-ghost">
          Compêndios
        </Link>
        <Link href="/aplicativo" className="btn btn-ghost">
          Instalar app
        </Link>
        <Link href={isTor ? "/mundo?sistema=um-anel" : "/mundo"} className="btn btn-ghost">
          Atlas e panteão
        </Link>
      </div>
    </div>
  );
}
