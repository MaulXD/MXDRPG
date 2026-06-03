const SEEDS = {
  armas: {
    pack: "vinite.armas",
    path: "systems/vinite/packs/seed/armas.json",
    setting: "armasSeedImported",
    dialogTitle: "ELDARIN.Seed.armasTitle",
    dialogBody: "ELDARIN.Seed.armasBody",
  },
  habilidades: {
    pack: "vinite.habilidades",
    path: "systems/vinite/packs/seed/habilidades.json",
    setting: "habilidadesSeedImported",
    dialogTitle: "ELDARIN.Seed.habilidadesTitle",
    dialogBody: "ELDARIN.Seed.habilidadesBody",
  },
};

/**
 * @param {"armas"|"habilidades"} key
 */
export async function seedCompendium(key) {
  const cfg = SEEDS[key];
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("ELDARIN.Seed.gmOnly"));
    return { created: 0 };
  }

  const pack = game.packs.get(cfg.pack);
  if (!pack) {
    ui.notifications.error(game.i18n.format("ELDARIN.Seed.noPackNamed", { pack: cfg.pack }));
    return { created: 0 };
  }

  if (pack.index.size > 0) {
    ui.notifications.info(game.i18n.localize("ELDARIN.Seed.alreadyHasEntries"));
    return { created: 0 };
  }

  const response = await fetch(cfg.path);
  if (!response.ok) throw new Error(`Fetch failed: ${cfg.path}`);
  const items = await response.json();
  const docs = await Item.createDocuments(items, { pack: pack.collection });

  await game.settings.set("vinite", cfg.setting, true);
  ui.notifications.info(game.i18n.format("ELDARIN.Seed.done", { count: docs.length }));
  return { created: docs.length };
}

export const seedArmasCompendium = () => seedCompendium("armas");
export const seedHabilidadesCompendium = () => seedCompendium("habilidades");

export function registerCompendiumSettings() {
  for (const cfg of Object.values(SEEDS)) {
    game.settings.register("vinite", cfg.setting, {
      name: cfg.setting,
      scope: "world",
      config: false,
      type: Boolean,
      default: false,
    });
  }
}

export function registerCompendiumSeedHooks() {
  Hooks.once("ready", async () => {
    if (!game.user.isGM) return;

    for (const [key, cfg] of Object.entries(SEEDS)) {
      const pack = game.packs.get(cfg.pack);
      if (!pack || pack.index.size > 0) continue;
      if (game.settings.get("vinite", cfg.setting)) continue;

      const importNow = await Dialog.confirm({
        title: game.i18n.localize(cfg.dialogTitle),
        content: `<p>${game.i18n.localize(cfg.dialogBody)}</p>`,
        yes: () => true,
        no: () => false,
        defaultYes: true,
      });

      if (importNow) await seedCompendium(key);
    }
  });
}
