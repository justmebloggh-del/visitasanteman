import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ConsentManager } from "@/components/consent/ConsentManager";
import { Footer } from "@/components/layout/Footer";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/layout/seo";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { getSettings, listAreas } from "@/lib/content/public";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { siteName: siteConfig.name, type: "website", locale: "en_GH" },
  appleWebApp: { capable: true, title: siteConfig.displayName, statusBarStyle: "default" },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
};

export const viewport: Viewport = { themeColor: "#174b35", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, areas] = await Promise.all([getSettings(), listAreas()]);
  const whatsapp = String(settings.contact?.whatsapp ?? "");
  const navDistricts = areas.map((a) => ({ slug: a.slug, name: a.name, kind: a.kind }));
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: SITE_URL }} />
        <Header districts={navDistricts} />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <PwaRegister />
        <WhatsAppButton number={whatsapp} />
        <ConsentManager gaId={gaId && /^G-[A-Z0-9]+$/.test(gaId) ? gaId : undefined} />
      </body>
    </html>
  );
}
