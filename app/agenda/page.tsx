import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCompromisso } from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { FilterBar } from "../components/FilterBar";
import { STATUS_COMPROMISSO, TIPO_COMPROMISSO } from "@/lib/enums";
import { buttonPrimaryClass, linkClass } from "@/lib/ui";
import { formatData } from "@/lib/format";
import { paramString } from "@/lib/query-params";
import type { Prisma, StatusCompromisso } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: PageProps<"/agenda">) {
  const params = await searchParams;
  const clienteId = paramString(params.clienteId);
  const status = paramString(params.status);
  const de = paramString(params.de);
  const ate = paramString(params.ate);

  const where: Prisma.CompromissoWhereInput = {};
  if (clienteId) where.contrato = { clienteId };
  if (status) where.status = status as StatusCompromisso;
  if (de || ate) {
    where.data = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    };
  }

  const [compromissos, clientes] = await Promise.all([
    prisma.compromisso.findMany({
      where,
      orderBy: { data: "asc" },
      include: { contrato: { include: { cliente: true } } },
    }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <Link href="/agenda/novo" className={buttonPrimaryClass}>
          Novo compromisso
        </Link>
      </div>

      <FilterBar
        action="/agenda"
        cliente={{
          value: clienteId,
          options: clientes.map((c) => ({ value: c.id, label: c.nome })),
        }}
        status={{
          value: status,
          options: Object.entries(STATUS_COMPROMISSO).map(([value, label]) => ({ value, label })),
        }}
        periodo={{ deValue: de, ateValue: ate, label: "Data" }}
      />

      {compromissos.length === 0 ? (
        <p className="text-brand-grey">Nenhum compromisso encontrado para os filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-navy-light text-left text-white">
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
                <tr key={compromisso.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 text-brand-grey">
                    {formatData(compromisso.data)}
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-text">
                    {compromisso.titulo}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {TIPO_COMPROMISSO[compromisso.tipo]}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {compromisso.contrato
                      ? `${compromisso.contrato.numero} — ${compromisso.contrato.cliente.nome}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
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
