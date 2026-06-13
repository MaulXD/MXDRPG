import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site-metadata";
import { Cinzel, Lora, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FriendsChatProvider } from "@/components/friends/FriendsChatProvider";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { hasClerkPublishableKey } from "@/lib/auth/clerk-config";
import { getSession } from "@/lib/auth/session";
import { SiteShell } from "@/components/SiteShell";
import { SiteHeaderWrapper } from "@/components/SiteHeaderWrapper";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { BackgroundWrapper } from "@/components/backgrounds/BackgroundWrapper";
import { BackgroundScript } from "@/components/backgrounds/BackgroundScript";
import { NativeTitleBlockScript } from "@/components/ui/NativeTitleBlockScript";
import { SiteTitleFixScript } from "@/components/ui/SiteTitleFixScript";
import { SiteTabTitle } from "@/components/ui/SiteTabTitle";
import { SiteTooltipLayer } from "@/components/ui/SiteTooltipLayer";
import "./globals.css";
import "@/components/nav-motion.css";
import "@/components/ui/medieval-borders.css";
import "@/components/home/home.css";
import "@/components/vtt/eldarin-v4.css";
import "@/components/backgrounds/animated-background-site.css";

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
  title: {
    default: SITE_NAME,
    template: `${SITE_NAME} — %s`,
  },
  description:
    "Mesa virtual no navegador: combate em grid, PA, fichas medievais. Admin, Mestre e Jogador.",
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = hasClerkPublishableKey()
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!.trim()
    : "";
  const session = await getSession();

  return (
    <html
      lang="pt-BR"
      className={`${lora.variable} ${cinzel.variable} ${sourceSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <SiteTitleFixScript />
        <NativeTitleBlockScript />
        <BackgroundScript />
      </head>
      <body>
        <ServiceWorkerRegister />
        <SiteTabTitle />
        <SiteTooltipLayer />
        <AuthProvider publishableKey={clerkPublishableKey}>
          <FriendsChatProvider initialUserId={session?.user.id ?? null}>
            <NotificationsProvider initialUserId={session?.user.id ?? null}>
              <BackgroundWrapper />
              <div className="site-app-root">
                <div className="site-bg" aria-hidden />
                <div className="site-noise" aria-hidden />
                <SiteShell header={<SiteHeaderWrapper />} footer={<SiteFooter />}>
                  {children}
                </SiteShell>
              </div>
            </NotificationsProvider>
          </FriendsChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
