import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { Suspense } from "react";
import { AssistantBubble } from "@/components/assistant-bubble";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devis voyages",
  description: "Choisissez un voyage, ajoutez des options et obtenez votre devis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        {/* La bulle lit l'adresse de la page (masquée dans l'administration). */}
        <Suspense>
          <AssistantBubble />
        </Suspense>
      </body>
    </html>
  );
}
