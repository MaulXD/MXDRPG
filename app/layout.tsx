import type { Metadata } from "next";
import { Cinzel, Lora, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FriendsChatProvider } from "@/components/friends/FriendsChatProvider";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import { SiteShell } from "@/components/SiteShell";
import { SiteHeaderWrapper } from "@/components/SiteHeaderWrapper";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";
import "@/components/nav-motion.css";
import "@/components/ui/medieval-borders.css";
import "@/components/home/home.css";
import "@/components/vtt/eldarin-v4.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = hasClerkPublishableKey()
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!.trim()
    : "";

  return (
    <html
      lang="pt-BR"
      className={`${lora.variable} ${cinzel.variable} ${sourceSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <AuthProvider publishableKey={clerkPublishableKey}>
          <FriendsChatProvider>
            <div className="site-bg" aria-hidden />
            <div className="site-noise" aria-hidden />
            <SiteShell header={<SiteHeaderWrapper />} footer={<SiteFooter />}>
              {children}
            </SiteShell>
          </FriendsChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
