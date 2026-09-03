import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCliente } from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { FilterBar } from "../components/FilterBar";
import { STATUS_CLIENTE } from "@/lib/enums";
import { buttonPrimaryClass, linkClass } from "@/lib/ui";
import { paramString } from "@/lib/query-params";
import type { StatusCliente } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: PageProps<"/clientes">) {
  const params = await searchParams;
  const erro = params.erro;
  const status = paramString(params.status);

  const clientes = await prisma.cliente.findMany({
    where: status ? { status: status as StatusCliente } : undefined,
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link href="/clientes/novo" className={buttonPrimaryClass}>
          Novo cliente
        </Link>
      </div>

      {typeof erro === "string" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <FilterBar
        action="/clientes"
        status={{
          value: status,
          options: Object.entries(STATUS_CLIENTE).map(([value, label]) => ({ value, label })),
        }}
      />

      {clientes.length === 0 ? (
        <p className="text-zinc-600">Nenhum cliente encontrado para os filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Setor</th>
                <th className="px-4 py-2 font-medium">Contato</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {cliente.nome}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {cliente.setor ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {cliente.contatoNome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {STATUS_CLIENTE[cliente.status]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/clientes/${cliente.id}/editar`}
                        className={linkClass}
                      >
                        Editar
                      </Link>
                      <form action={deleteCliente.bind(null, cliente.id)}>
                        <DeleteButton
                          confirmMessage={`Excluir o cliente "${cliente.nome}"?`}
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
