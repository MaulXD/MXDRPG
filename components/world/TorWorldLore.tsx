import "./tor-world-lore.css";

type Place = { name: string; text: string };

const PLACES: Place[] = [
  {
    name: "Eriador",
    text: "\"A terra solitária\", em élfico cinzento — outrora domínio de reis antigos, hoje maiormente ruínas lembradas por poucos. Pequenos bolsões de civilização resistem (Bri, o Condado), quase alheios aos perigos ao redor.",
  },
  {
    name: "O Condado",
    text: "Lar dos Hobbits, no coração de Eriador, entre o rio Brandevin e a Floresta Velha a leste, os Confins Ocidentais a oeste. Terra abrigada, protegida por guardiões discretos (os Rangers) — os Hobbits raramente viajam para longe.",
  },
  {
    name: "Lago Evendim",
    text: "Grande lago aos pés das Colinas de Evendim, chamado Nenuial (\"Lago do Crepúsculo\") em sindarin. Suas águas escondem as ruínas submersas de Annúminas, antiga capital do Reino do Norte — dizem que \"Navios do Crepúsculo\" fantasmas aparecem em noites sem lua.",
  },
  {
    name: "Bri",
    text: "Comunidade de Homens e Hobbits (\"o Povo Grande e o Povo Pequeno\") na Estrada Leste, desde a Era Antiga. O Pônei Saltitante, a grande estalagem administrada por Barnabé Bolseiro-de-Manteiga, recebe a todos — inclusive Rangers, sempre sentados nos fundos.",
  },
  {
    name: "O Bosque de Chet",
    text: "Vasta e selvagem floresta entre a Colina de Bri e as Colinas do Tempo — copas densas bloqueiam o sol. A leste ficam os Pântanos de Água-Mosquito, brejo traiçoeiro que ninguém atravessa de bom grado.",
  },
  {
    name: "A Grande Estrada do Leste",
    text: "Estrada antiga, dizem que originada nas Colinas de Ferro, seguindo até os Portos Cinzentos no Golfo de Lhûn. O tráfego cresceu desde a morte de Smaug e a restauração de Valle/Erebor.",
  },
];

export function TorWorldLore() {
  return (
    <div className="tor-world-lore">
      <p className="tor-world-lore__lead">
        Eriador ao fim da Terceira Era — os principais lugares que uma Companhia encontra explorando a
        partir de Bri ou do Condado (Core Rules, Cap. 9).
      </p>
      <div className="tor-world-lore__grid">
        {PLACES.map((p) => (
          <article key={p.name} className="tor-world-lore__card">
            <h3>{p.name}</h3>
            <p>{p.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
