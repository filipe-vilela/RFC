import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteContrato } from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { PERIODICIDADE, STATUS_CONTRATO } from "@/lib/enums";
import { buttonPrimaryClass, linkClass } from "@/lib/ui";
import { formatData, formatMoeda } from "@/lib/format";

export default async function ContratosPage({
  searchParams,
}: PageProps<"/contratos">) {
  const { erro } = await searchParams;
  const contratos = await prisma.contrato.findMany({
    orderBy: { dataInicio: "desc" },
    include: { cliente: true },
  });

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

      {contratos.length === 0 ? (
        <p className="text-zinc-600">Nenhum contrato cadastrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
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
                <tr key={contrato.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {contrato.numero}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {contrato.cliente.nome}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatMoeda(contrato.valor)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {PERIODICIDADE[contrato.periodicidade]}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatData(contrato.dataInicio)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
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
