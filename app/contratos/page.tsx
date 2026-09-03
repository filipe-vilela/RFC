import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteContrato } from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { FilterBar } from "../components/FilterBar";
import { PERIODICIDADE, STATUS_CONTRATO } from "@/lib/enums";
import { buttonPrimaryClass, linkClass } from "@/lib/ui";
import { formatData, formatMoeda } from "@/lib/format";
import { paramString } from "@/lib/query-params";
import type { Prisma, StatusContrato } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratos" };

export default async function ContratosPage({
  searchParams,
}: PageProps<"/contratos">) {
  const params = await searchParams;
  const erro = params.erro;
  const clienteId = paramString(params.clienteId);
  const status = paramString(params.status);
  const de = paramString(params.de);
  const ate = paramString(params.ate);

  const where: Prisma.ContratoWhereInput = {};
  if (clienteId) where.clienteId = clienteId;
  if (status) where.status = status as StatusContrato;
  if (de || ate) {
    where.dataInicio = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    };
  }

  const [contratos, clientes] = await Promise.all([
    prisma.contrato.findMany({
      where,
      orderBy: { dataInicio: "desc" },
      include: { cliente: true },
    }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contratos</h1>
        <Link href="/contratos/novo" className={buttonPrimaryClass}>
          Novo contrato
        </Link>
      </div>

      {typeof erro === "string" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <FilterBar
        action="/contratos"
        cliente={{
          value: clienteId,
          options: clientes.map((c) => ({ value: c.id, label: c.nome })),
        }}
        status={{
          value: status,
          options: Object.entries(STATUS_CONTRATO).map(([value, label]) => ({ value, label })),
        }}
        periodo={{ deValue: de, ateValue: ate, label: "Início" }}
      />

      {contratos.length === 0 ? (
        <p className="text-brand-grey">Nenhum contrato encontrado para os filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-navy-light text-left text-white">
              <tr>
                <th className="px-4 py-2 font-medium">Número</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Periodicidade</th>
                <th className="px-4 py-2 font-medium">Início</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => (
                <tr key={contrato.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 font-medium text-brand-text">
                    {contrato.numero}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {contrato.cliente.nome}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {formatMoeda(contrato.valor)}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {PERIODICIDADE[contrato.periodicidade]}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {formatData(contrato.dataInicio)}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">
                    {STATUS_CONTRATO[contrato.status]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/contratos/${contrato.id}/editar`}
                        className={linkClass}
                      >
                        Editar
                      </Link>
                      <form action={deleteContrato.bind(null, contrato.id)}>
                        <DeleteButton
                          confirmMessage={`Excluir o contrato "${contrato.numero}"?`}
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
