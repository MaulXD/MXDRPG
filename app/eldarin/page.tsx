import { redirect } from "next/navigation";
import { ELDARIN_MESAS_PATH } from "@/lib/rpg/systems";

/** Legado — mesas Eldarin agora em /rpg/eldarin */
export default function EldarinLegacyRedirect() {
  redirect(ELDARIN_MESAS_PATH);
}
