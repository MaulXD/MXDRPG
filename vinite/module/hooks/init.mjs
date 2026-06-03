import { ELDARIN } from "../config.mjs";
import { EldarinActor } from "../documents/actor.mjs";
import { EldarinItem } from "../documents/item.mjs";
import { EldarinActorCharacterSheet } from "../sheets/actor-character-sheet.mjs";
import { EldarinActorNpcSheet } from "../sheets/actor-npc-sheet.mjs";
import { EldarinItemSheet } from "../sheets/item-sheet.mjs";
import {
  registerCompendiumSeedHooks,
  registerCompendiumSettings,
  seedArmasCompendium,
  seedHabilidadesCompendium,
  seedCompendium,
} from "../data/compendium-seed.mjs";
import { registerDataModels } from "../data/models/register.mjs";
import { registerDragRulerIntegration } from "./drag-ruler.mjs";
import { registerMovementApHooks } from "./movement-ap.mjs";
import { registerSocketHandlers } from "./socket.mjs";
import { executeAttack } from "../automation/attack-sequence.mjs";

/**
 * Bootstrap do sistema — registro de documentos, fichas e integrações.
 */
export function registerInitHooks() {
  Hooks.once("init", () => {
    console.log("Eldarin | Inicializando sistema…");

    CONFIG.ELDARIN = ELDARIN;

    CONFIG.Actor.documentClass = EldarinActor;
    CONFIG.Item.documentClass = EldarinItem;

    registerCompendiumSettings();
    registerDataModels();

    loadTemplates(["systems/vinite/templates/actor/parts/inventory-tab.hbs"]);

    Actors.registerSheet("vinite", EldarinActorCharacterSheet, {
      types: ["character"],
      makeDefault: true,
      label: "ELDARIN.Sheet.character",
    });
    Actors.registerSheet("vinite", EldarinActorNpcSheet, {
      types: ["npc"],
      makeDefault: true,
      label: "ELDARIN.Sheet.npc",
    });

    Items.registerSheet("vinite", EldarinItemSheet, {
      types: ["arma", "habilidade", "equipamento", "efeito"],
      makeDefault: true,
      label: "ELDARIN.Sheet.item",
    });

    game.vinite = {
      automation: { executeAttack },
      seed: { seedArmasCompendium, seedHabilidadesCompendium, seedCompendium },
    };

    registerDragRulerIntegration();
    registerMovementApHooks();
  });

  Hooks.once("ready", () => {
    registerSocketHandlers();
    registerCompendiumSeedHooks();
    warnMissingModules();
  });
}

function warnMissingModules() {
  if (!game.user.isGM) return;
  for (const mod of ELDARIN.requiredModules) {
    const active = game.modules.get(mod.id)?.active;
    if (!active) {
      console.warn(`Eldarin | Módulo recomendado inativo: ${mod.label} (${mod.id})`);
    }
  }
}
