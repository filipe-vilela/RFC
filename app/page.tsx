import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { StatCard } from "@/app/components/StatCard";
import { TIPO_COMPROMISSO } from "@/lib/enums";
import { formatData, formatMoeda } from "@/lib/format";
import { linkClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const {
    totalPrevistoNoMes,
    totalRecebidoNoMes,
    totalAReceberNoMes,
    contratosAtivos,
    inadimplentes,
    totalInadimplente,
    proximosPrazos,
  } = await getDashboardData();

  const mesAtual = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-brand-grey capitalize">{mesAtual}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Previsto no mês" value={formatMoeda(totalPrevistoNoMes)} />
        <StatCard label="Recebido no mês" value={formatMoeda(totalRecebidoNoMes)} />
        <StatCard label="A receber no mês" value={formatMoeda(totalAReceberNoMes)} />
        <StatCard
          label="Inadimplência"
          value={formatMoeda(totalInadimplente)}
          hint={`${inadimplentes.length} recebimento(s) em atraso`}
          tone={inadimplentes.length > 0 ? "warning" : "default"}
        />
        <StatCard label="Contratos ativos" value={String(contratosAtivos)} />
        <StatCard
          label="Próximos prazos"
          value={String(proximosPrazos.length)}
          hint="nos próximos compromissos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Próximos prazos</h2>
            <Link href="/agenda" className={linkClass}>
              Ver agenda
            </Link>
          </div>
          {proximosPrazos.length === 0 ? (
            <p className="text-sm text-brand-grey">Nenhum compromisso pendente.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {proximosPrazos.map((compromisso) => (
                    <tr key={compromisso.id} className="border-t border-brand-border first:border-t-0">
                      <td className="px-4 py-2 whitespace-nowrap text-brand-grey">
                        {formatData(compromisso.data)}
                      </td>
                      <td className="px-4 py-2 font-medium text-brand-text">
                        {compromisso.titulo}
                      </td>
                      <td className="px-4 py-2 text-brand-grey">
                        {TIPO_COMPROMISSO[compromisso.tipo]}
                      </td>
                      <td className="px-4 py-2 text-brand-grey">
                        {compromisso.contrato?.cliente.nome ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recebimentos em atraso</h2>
            <Link href="/recebimentos" className={linkClass}>
              Ver recebimentos
            </Link>
          </div>
          {inadimplentes.length === 0 ? (
            <p className="text-sm text-brand-grey">Nenhum recebimento em atraso.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {inadimplentes.map((recebimento) => (
                    <tr key={recebimento.id} className="border-t border-brand-border first:border-t-0">
                      <td className="px-4 py-2 whitespace-nowrap text-brand-grey">
                        {formatData(recebimento.dataPrevista)}
                      </td>
                      <td className="px-4 py-2 font-medium text-brand-text">
                        {recebimento.contrato.cliente.nome}
                      </td>
                      <td className="px-4 py-2 text-brand-grey">
                        {recebimento.contrato.numero}
                      </td>
                      <td className="px-4 py-2 text-right text-red-700">
                        {formatMoeda(recebimento.valorPrevisto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
