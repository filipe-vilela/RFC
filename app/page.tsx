import Link from "next/link";
import { linkClass } from "@/lib/ui";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-zinc-600">
        O painel financeiro consolidado será implementado numa próxima etapa.
        Por enquanto, use os links abaixo para gerenciar os cadastros.
      </p>
      <ul className="flex flex-col gap-2">
        <li>
          <Link href="/clientes" className={linkClass}>
            Clientes
          </Link>
        </li>
        <li>
          <Link href="/contratos" className={linkClass}>
            Contratos
          </Link>
        </li>
        <li>
          <Link href="/recebimentos" className={linkClass}>
            Recebimentos
          </Link>
        </li>
        <li>
          <Link href="/agenda" className={linkClass}>
            Agenda
          </Link>
        </li>
      </ul>
    </div>
  );
}
