import { redirect } from "next/navigation";

export default function MestreLayout({ children }: { children: React.ReactNode }) {
  redirect("/painel");
  return children;
}
