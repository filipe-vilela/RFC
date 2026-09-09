"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/contratos", label: "Contratos" },
  { href: "/recebimentos", label: "Recebimentos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/calendario", label: "Calendário" },
];

function isAtivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1">
      {NAV_LINKS.map((link) => {
        const ativo = isAtivo(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={
              "border-b-2 pb-0.5 text-sm font-medium transition-colors " +
              (ativo
                ? "border-brand-orange text-brand-navy"
                : "border-transparent text-brand-grey hover:text-brand-navy")
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
