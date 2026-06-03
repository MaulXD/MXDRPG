import { EldarinCharacterDataModel } from "./actor-character.mjs";
import { EldarinNpcDataModel } from "./actor-npc.mjs";
import { EldarinArmaDataModel } from "./item-arma.mjs";
import { EldarinHabilidadeDataModel } from "./item-habilidade.mjs";
import { EldarinEquipamentoDataModel } from "./item-equipamento.mjs";
import { EldarinEfeitoDataModel } from "./item-efeito.mjs";

/**
 * Registra DataModels se Foundry v12+ expõe TypeDataModel.
 * v11: template.json continua fonte de verdade.
 */
export function registerDataModels() {
  if (!foundry.abstract?.TypeDataModel) {
    console.log("Eldarin | DataModels skip (Foundry < 12 ou API indisponível).");
    return;
  }

  CONFIG.Actor.dataModels.character = EldarinCharacterDataModel;
  CONFIG.Actor.dataModels.npc = EldarinNpcDataModel;
  CONFIG.Item.dataModels.arma = EldarinArmaDataModel;
  CONFIG.Item.dataModels.habilidade = EldarinHabilidadeDataModel;
  CONFIG.Item.dataModels.equipamento = EldarinEquipamentoDataModel;
  CONFIG.Item.dataModels.efeito = EldarinEfeitoDataModel;

  console.log("Eldarin | DataModels v12 registrados.");
}
