import { redirect } from "next/navigation";

export default function JogadorLayout({ children }: { children: React.ReactNode }) {
  redirect("/mesas");
  return children;
}
