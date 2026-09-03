import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteRecebimento, marcarComoPago } from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { FilterBar } from "../components/FilterBar";
import { ORIGEM_RECEBIMENTO, STATUS_RECEBIMENTO } from "@/lib/enums";
import { buttonPrimaryClass, buttonSecondaryClass, linkClass } from "@/lib/ui";
import { formatData, formatMoeda } from "@/lib/format";
import { paramString } from "@/lib/query-params";
import type { Prisma, StatusRecebimento } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function RecebimentosPage({
  searchParams,
}: PageProps<"/recebimentos">) {
  const params = await searchParams;
  const clienteId = paramString(params.clienteId);
  const status = paramString(params.status);
  const de = paramString(params.de);
  const ate = paramString(params.ate);

  const where: Prisma.RecebimentoWhereInput = {};
  if (clienteId) where.contrato = { clienteId };
  if (status) where.status = status as StatusRecebimento;
  if (de || ate) {
    where.dataPrevista = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    };
  }

  const [recebimentos, clientes] = await Promise.all([
    prisma.recebimento.findMany({
      where,
      orderBy: { dataPrevista: "desc" },
      include: { contrato: { include: { cliente: true } } },
    }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <Link href="/recebimentos/novo" className={buttonPrimaryClass}>
          Novo recebimento
        </Link>
      </div>

      <FilterBar
        action="/recebimentos"
        cliente={{
          value: clienteId,
          options: clientes.map((c) => ({ value: c.id, label: c.nome })),
        }}
        status={{
          value: status,
          options: Object.entries(STATUS_RECEBIMENTO).map(([value, label]) => ({ value, label })),
        }}
        periodo={{ deValue: de, ateValue: ate, label: "Data prevista" }}
      />

      {recebimentos.length === 0 ? (
        <p className="text-zinc-600">Nenhum recebimento encontrado para os filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Contrato</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Valor previsto</th>
                <th className="px-4 py-2 font-medium">Data prevista</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Origem</th>
                <th className="px-4 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recebimentos.map((recebimento) => (
                <tr key={recebimento.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {recebimento.contrato.numero}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {recebimento.contrato.cliente.nome}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatMoeda(recebimento.valorPrevisto)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatData(recebimento.dataPrevista)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {STATUS_RECEBIMENTO[recebimento.status]}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {ORIGEM_RECEBIMENTO[recebimento.origem]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {recebimento.status !== "PAGO" && (
                        <form action={marcarComoPago.bind(null, recebimento.id)}>
                          <button type="submit" className={buttonSecondaryClass}>
                            Marcar como pago
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/recebimentos/${recebimento.id}/editar`}
                        className={linkClass}
                      >
                        Editar
                      </Link>
                      <form action={deleteRecebimento.bind(null, recebimento.id)}>
                        <DeleteButton
                          confirmMessage={`Excluir este recebimento de ${recebimento.contrato.numero}?`}
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
