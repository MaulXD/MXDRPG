import { redirect } from "next/navigation";

/** Rota legada — hub de mesas agora em /mesas */
export default function RpgSelectPage() {
  redirect("/mesas");
}