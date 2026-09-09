import type { Metadata } from "next";
import Image from "next/image";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { NavLinks } from "@/app/components/NavLinks";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: { default: "Gestão RFC", template: "%s | Gestão RFC" },
  description: "Contratos, recebimentos e agenda — Real Forte Consultoria",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-grey-light text-brand-text">
        <header className="border-b border-brand-border bg-white print:hidden">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
            <Image
              src="/logo-real-forte.png"
              alt="Real Forte Consultoria"
              width={1793}
              height={486}
              priority
              className="h-14 w-auto"
            />
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
