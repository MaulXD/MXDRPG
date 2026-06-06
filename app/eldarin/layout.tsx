import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EldarinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar?redirect=/eldarin");
  return children;
}
