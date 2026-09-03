import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
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
  title: "Gestão RFC",
  description: "Contratos, recebimentos e agenda — Real Forte Consultoria",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/contratos", label: "Contratos" },
  { href: "/recebimentos", label: "Recebimentos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/calendario", label: "Calendário" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-grey-light text-brand-text">
        <header className="bg-brand-navy">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
            <span className="font-serif text-lg text-white">Gestão RFC</span>
            <nav className="flex gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#D6DAEE] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
