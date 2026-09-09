import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BotaoImprimir } from "@/app/components/BotaoImprimir";
import { paramString } from "@/lib/query-params";
import { linkClass } from "@/lib/ui";
import { formatData, formatMoeda } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relação de notas fiscais" };

function inicioMesUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1));
}

function addMeses(data: Date, meses: number): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, 1));
}

function formatMesParam(data: Date): string {
  return data.toISOString().slice(0, 7);
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function NotasFiscaisPage({
  searchParams,
}: PageProps<"/recebimentos/notas-fiscais">) {
  const params = await searchParams;
  const mesParam = paramString(params.mes);
  const mesRef =
    mesParam && !Number.isNaN(Date.parse(`${mesParam}-01`))
      ? inicioMesUTC(new Date(`${mesParam}-01`))
      : inicioMesUTC(new Date());
  const proximoMes = addMeses(mesRef, 1);
  const mesAnterior = addMeses(mesRef, -1);

  const recebimentos = await prisma.recebimento.findMany({
    where: { dataPrevista: { gte: mesRef, lt: proximoMes } },
    include: { contrato: { include: { cliente: true } } },
    orderBy: { dataPrevista: "asc" },
  });

  const ordenados = [...recebimentos].sort((a, b) => {
    if (a.dataEmissaoNF && b.dataEmissaoNF) return a.dataEmissaoNF.getTime() - b.dataEmissaoNF.getTime();
    if (a.dataEmissaoNF) return -1;
    if (b.dataEmissaoNF) return 1;
    return a.dataPrevista.getTime() - b.dataPrevista.getTime();
  });

  const totalPrevisto = ordenados.reduce((soma, r) => soma + r.valorPrevisto, 0);
  const mesLabel = capitalizar(
    mesRef.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-semibold">Relação de notas fiscais</h1>
        <Link href="/recebimentos" className={linkClass}>
          Voltar para Recebimentos
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Link href={`/recebimentos/notas-fiscais?mes=${formatMesParam(mesAnterior)}`} className={linkClass}>
            ← Mês anterior
          </Link>
          <Link href={`/recebimentos/notas-fiscais?mes=${formatMesParam(proximoMes)}`} className={linkClass}>
            Próximo mês →
          </Link>
        </div>
        <BotaoImprimir />
      </div>

      <div>
        <h2 className="font-serif text-xl text-brand-navy">Notas fiscais a emitir — {mesLabel}</h2>
        <p className="text-sm text-brand-grey">
          {ordenados.length} recebimento(s) — total previsto {formatMoeda(totalPrevisto)}
        </p>
      </div>

      {ordenados.length === 0 ? (
        <p className="text-brand-grey">Nenhum recebimento previsto para este mês.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-navy-light text-left text-white print:bg-white print:text-brand-navy print:border-b print:border-brand-navy">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Contrato</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Data prevista</th>
                <th className="px-4 py-2 font-medium">Data de emissão da NF</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((recebimento) => (
                <tr key={recebimento.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 font-medium text-brand-text">
                    {recebimento.contrato.cliente.nome}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">{recebimento.contrato.numero}</td>
                  <td className="px-4 py-3 text-brand-grey">{formatMoeda(recebimento.valorPrevisto)}</td>
                  <td className="px-4 py-3 text-brand-grey">{formatData(recebimento.dataPrevista)}</td>
                  <td className="px-4 py-3 text-brand-grey">
                    {recebimento.dataEmissaoNF ? formatData(recebimento.dataEmissaoNF) : "—"}
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
