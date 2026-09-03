import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCompromisso } from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { STATUS_COMPROMISSO, TIPO_COMPROMISSO } from "@/lib/enums";
import { buttonPrimaryClass, linkClass } from "@/lib/ui";
import { formatData } from "@/lib/format";

export default async function AgendaPage() {
  const compromissos = await prisma.compromisso.findMany({
    orderBy: { data: "asc" },
    include: { contrato: { include: { cliente: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <Link href="/agenda/novo" className={buttonPrimaryClass}>
          Novo compromisso
        </Link>
      </div>

      {compromissos.length === 0 ? (
        <p className="text-zinc-600">Nenhum compromisso cadastrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Título</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Contrato / Cliente</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {compromissos.map((compromisso) => (
                <tr key={compromisso.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-zinc-600">
                    {formatData(compromisso.data)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {compromisso.titulo}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {TIPO_COMPROMISSO[compromisso.tipo]}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {compromisso.contrato
                      ? `${compromisso.contrato.numero} — ${compromisso.contrato.cliente.nome}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {STATUS_COMPROMISSO[compromisso.status]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/agenda/${compromisso.id}/editar`}
                        className={linkClass}
                      >
                        Editar
                      </Link>
                      <form action={deleteCompromisso.bind(null, compromisso.id)}>
                        <DeleteButton
                          confirmMessage={`Excluir o compromisso "${compromisso.titulo}"?`}
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
