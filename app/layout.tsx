import type { Metadata } from "next";
import { Cinzel, Lora } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { SiteShell } from "@/components/SiteShell";
import { SiteHeaderWrapper } from "@/components/SiteHeaderWrapper";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";
import "@/components/home/home.css";
import "@/components/vtt/vtt.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eldarin — VTT tático hexagonal",
  description:
    "Mesa virtual no navegador: combaté hex, PA, fichas medievais. Admin, Mestre e Jogador.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkOn = isClerkEnabled();

  return (
    <html lang="pt-BR" className={`${lora.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AuthProvider enabled={clerkOn}>
          <div className="site-bg" aria-hidden />
          <div className="site-noise" aria-hidden />
          <SiteShell header={<SiteHeaderWrapper />} footer={<SiteFooter />}>
            {children}
          </SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
