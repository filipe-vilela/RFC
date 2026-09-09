import Link from "next/link";
import {
  addMeses,
  addSemanas,
  getDadosCalendario,
  inicioMes,
  type VisaoCalendario,
} from "@/lib/calendario";
import { paramString } from "@/lib/query-params";
import { linkClass } from "@/lib/ui";
import { CalendarioGrid } from "./CalendarioGrid";

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

      <CalendarioGrid
        dias={dias}
        visao={visao}
        mesRef={dataRef.getUTCMonth()}
        hoje={formatDataParam(hoje)}
      />

      <div className="flex flex-wrap gap-4 text-xs text-brand-grey">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-orange" /> Atendimento recorrente
          (contrato ativo — arraste para remarcar)
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
