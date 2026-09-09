import Link from "next/link";
import {
  addMeses,
  addSemanas,
  getDadosCalendario,
  inicioMes,
  type VisaoCalendario,
} from "@/lib/calendario";
import { DIAS_SEMANA_LABELS } from "@/lib/dias-semana";
import { STATUS_COMPROMISSO, TIPO_COMPROMISSO } from "@/lib/enums";
import { paramString } from "@/lib/query-params";
import { linkClass } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendário" };

function inicioDoDiaUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

function formatDataParam(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function formatDiaMes(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function itemBadgeClass(status?: string): string {
  if (status === "CONCLUIDO") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELADO") return "bg-zinc-100 text-zinc-400 line-through";
  return "bg-brand-navy-light/10 text-brand-navy";
}

export default async function CalendarioPage({
  searchParams,
}: PageProps<"/calendario">) {
  const params = await searchParams;
  const visao: VisaoCalendario = paramString(params.visao) === "semana" ? "semana" : "mes";
  const dataParam = paramString(params.data);
  const dataRef = dataParam && !Number.isNaN(Date.parse(dataParam)) ? new Date(dataParam) : new Date();

  const { inicio, fim, dias } = await getDadosCalendario(visao, dataRef);
  const hoje = inicioDoDiaUTC(new Date());
  const ultimoDiaVisivel = new Date(fim.getTime() - 86400000);

  const primeiroDiaDoMesRef = inicioMes(dataRef);
  const referenciaAnterior =
    visao === "mes" ? addMeses(primeiroDiaDoMesRef, -1) : addSemanas(inicio, -1);
  const referenciaProxima =
    visao === "mes" ? addMeses(primeiroDiaDoMesRef, 1) : addSemanas(inicio, 1);

  const periodoLabel =
    visao === "mes"
      ? capitalizar(
          primeiroDiaDoMesRef.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),
        )
      : `${formatDiaMes(inicio)} – ${formatDiaMes(ultimoDiaVisivel)} de ${inicio.getUTCFullYear()}`;

  const linkFiltro = (overrides: { visao?: VisaoCalendario; data?: Date }) => {
    const v = overrides.visao ?? visao;
    const d = overrides.data ?? dataRef;
    return `/calendario?visao=${v}&data=${formatDataParam(d)}`;
  };

  const semanas: (typeof dias)[] = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Calendário de atendimento</h1>
        <div className="flex items-center gap-2">
          <Link href={linkFiltro({ visao: "semana" })} className={linkClass}>
            Semana
          </Link>
          <Link href={linkFiltro({ visao: "mes" })} className={linkClass}>
            Mês
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={linkFiltro({ data: referenciaAnterior })} className={linkClass}>
            ← Anterior
          </Link>
          <Link href="/calendario" className={linkClass}>
            Hoje
          </Link>
          <Link href={linkFiltro({ data: referenciaProxima })} className={linkClass}>
            Próximo →
          </Link>
        </div>
        <p className="font-medium text-brand-navy">{periodoLabel}</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-brand-border bg-white">
        <div className="grid min-w-[700px] grid-cols-7 border-b border-brand-border bg-brand-grey-light text-xs font-medium text-brand-grey">
          {DIAS_SEMANA_LABELS.map((d) => (
            <div key={d.index} className="px-2 py-2 text-center">
              {d.label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[700px] grid-cols-1">
          {semanas.map((semana, i) => (
            <div key={i} className="grid grid-cols-7 divide-x divide-brand-border border-b border-brand-border last:border-b-0">
              {semana.map((dia) => {
                const foraDoMes =
                  visao === "mes" && dia.data.getUTCMonth() !== dataRef.getUTCMonth();
                const ehHoje = dia.data.getTime() === hoje.getTime();

                return (
                  <div
                    key={dia.data.toISOString()}
                    className={
                      "min-h-[110px] p-2 align-top text-xs " +
                      (foraDoMes ? "bg-brand-grey-light text-zinc-400" : "text-brand-text")
                    }
                  >
                    <p
                      className={
                        "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium " +
                        (ehHoje ? "bg-brand-orange text-white" : "text-brand-grey")
                      }
                    >
                      {dia.data.getUTCDate()}
                    </p>
                    <div className="space-y-1">
                      {dia.itens.map((item, idx) =>
                        item.tipo === "atendimento" ? (
                          <div
                            key={`a-${idx}`}
                            className="truncate rounded bg-brand-orange-light px-1.5 py-0.5 text-brand-navy"
                            title={`Atendimento — ${item.clienteNome} (${item.contratoNumero})`}
                          >
                            {item.clienteNome}
                          </div>
                        ) : (
                          <div
                            key={`c-${idx}`}
                            className={"truncate rounded px-1.5 py-0.5 " + itemBadgeClass(item.status)}
                            title={`${TIPO_COMPROMISSO[item.tipoCompromisso]} — ${item.titulo}${
                              item.clienteNome ? ` (${item.clienteNome})` : ""
                            } — ${STATUS_COMPROMISSO[item.status]}`}
                          >
                            {item.titulo}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-brand-grey">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-orange" /> Atendimento recorrente
          (contrato ativo)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-navy-light" /> Compromisso pendente
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" /> Concluído
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-300" /> Cancelado
        </span>
      </div>
    </div>
  );
}
