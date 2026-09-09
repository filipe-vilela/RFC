import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  deleteRecebimento,
  excluirSelecionados,
  marcarComoPago,
  marcarSelecionadosComoPago,
} from "./actions";
import { DeleteButton } from "../components/DeleteButton";
import { ConfirmButton } from "../components/ConfirmButton";
import { SelecionarTodos } from "../components/SelecionarTodos";
import { FilterBar } from "../components/FilterBar";
import { ORIGEM_RECEBIMENTO, STATUS_RECEBIMENTO_EFETIVO } from "@/lib/enums";
import { buttonPrimaryClass, buttonSecondaryClass, buttonDangerClass, linkClass } from "@/lib/ui";
import { formatData, formatMoeda } from "@/lib/format";
import { paramString } from "@/lib/query-params";
import { condicaoStatusEfetivo, statusEfetivo } from "@/lib/recebimento-status";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recebimentos" };

export default async function RecebimentosPage({
  searchParams,
}: PageProps<"/recebimentos">) {
  const params = await searchParams;
  const clienteId = paramString(params.clienteId);
  const status = paramString(params.status);
  const de = paramString(params.de);
  const ate = paramString(params.ate);
  const hoje = new Date();

  const where: Prisma.RecebimentoWhereInput = {};
  if (clienteId) where.contrato = { clienteId };
  if (status) Object.assign(where, condicaoStatusEfetivo(status, hoje));
  if (de || ate) {
    where.dataPrevista = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    };
  }

  const [recebimentos, clientes] = await Promise.all([
    prisma.recebimento.findMany({
      where,
      orderBy: { dataPrevista: "asc" },
      include: { contrato: { include: { cliente: true } } },
    }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <div className="flex gap-3">
          <Link href="/recebimentos/notas-fiscais" className={buttonSecondaryClass}>
            Relação de notas fiscais
          </Link>
          <Link href="/recebimentos/novo" className={buttonPrimaryClass}>
            Novo recebimento
          </Link>
        </div>
      </div>

      <FilterBar
        action="/recebimentos"
        cliente={{
          value: clienteId,
          options: clientes.map((c) => ({ value: c.id, label: c.nome })),
        }}
        status={{
          value: status,
          options: Object.entries(STATUS_RECEBIMENTO_EFETIVO).map(([value, label]) => ({
            value,
            label,
          })),
        }}
        periodo={{ deValue: de, ateValue: ate, label: "Data prevista" }}
      />

      {recebimentos.length === 0 ? (
        <p className="text-brand-grey">Nenhum recebimento encontrado para os filtros selecionados.</p>
      ) : (
        <form className="space-y-3">
          <div className="flex gap-2">
            <ConfirmButton
              formAction={marcarSelecionadosComoPago}
              confirmMessage="Marcar todos os recebimentos selecionados como recebidos?"
              className={buttonSecondaryClass}
            >
              Marcar selecionados como recebido
            </ConfirmButton>
            <ConfirmButton
              formAction={excluirSelecionados}
              confirmMessage="Excluir todos os recebimentos selecionados? Essa ação não pode ser desfeita."
              className={buttonDangerClass}
            >
              Excluir selecionados
            </ConfirmButton>
          </div>

          <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-brand-navy-light text-left text-white">
                <tr>
                  <th className="px-4 py-2">
                    <SelecionarTodos nomeCampo="ids" />
                  </th>
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
                {recebimentos.map((recebimento) => {
                  const efetivo = statusEfetivo(recebimento, hoje);
                  return (
                    <tr key={recebimento.id} className="border-t border-brand-border">
                      <td className="px-4 py-3">
                        <input type="checkbox" name="ids" value={recebimento.id} />
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-text">
                        {recebimento.contrato.numero}
                      </td>
                      <td className="px-4 py-3 text-brand-grey">
                        {recebimento.contrato.cliente.nome}
                      </td>
                      <td className="px-4 py-3 text-brand-grey">
                        {formatMoeda(recebimento.valorPrevisto)}
                      </td>
                      <td className="px-4 py-3 text-brand-grey">
                        {formatData(recebimento.dataPrevista)}
                      </td>
                      <td
                        className={
                          "px-4 py-3 " +
                          (efetivo === "ATRASADO" ? "text-red-700" : "text-brand-grey")
                        }
                      >
                        {STATUS_RECEBIMENTO_EFETIVO[efetivo]}
                      </td>
                      <td className="px-4 py-3 text-brand-grey">
                        {ORIGEM_RECEBIMENTO[recebimento.origem]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {efetivo !== "PAGO" && (
                            <button
                              type="submit"
                              formAction={marcarComoPago.bind(null, recebimento.id)}
                              className={buttonSecondaryClass}
                            >
                              Recebido
                            </button>
                          )}
                          <Link
                            href={`/recebimentos/${recebimento.id}/editar`}
                            className={linkClass}
                          >
                            Editar
                          </Link>
                          <DeleteButton
                            formAction={deleteRecebimento.bind(null, recebimento.id)}
                            confirmMessage={`Excluir este recebimento de ${recebimento.contrato.numero}?`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </form>
      )}
    </div>
  );
}
