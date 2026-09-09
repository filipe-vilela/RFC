"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moverAtendimento } from "./actions";
import { DIAS_SEMANA_LABELS } from "@/lib/dias-semana";
import { STATUS_COMPROMISSO, TIPO_COMPROMISSO } from "@/lib/enums";
import type { DiaCalendario, VisaoCalendario } from "@/lib/calendario";

function formatDataParam(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function itemBadgeClass(status?: string): string {
  if (status === "CONCLUIDO") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELADO") return "bg-zinc-100 text-zinc-400 line-through";
  return "bg-brand-navy-light/10 text-brand-navy";
}

type Arrastando = { contratoId: string; dataOriginal: string; dataAtual: string } | null;

export function CalendarioGrid({
  dias,
  visao,
  mesRef,
  hoje,
}: {
  dias: DiaCalendario[];
  visao: VisaoCalendario;
  mesRef: number;
  hoje: string;
}) {
  const router = useRouter();
  const [arrastando, setArrastando] = useState<Arrastando>(null);
  const [sobreData, setSobreData] = useState<string | null>(null);

  const semanas: DiaCalendario[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }

  async function soltarEm(dataDestinoISO: string) {
    setSobreData(null);
    if (!arrastando) return;
    const { contratoId, dataOriginal, dataAtual } = arrastando;
    setArrastando(null);
    // Soltou na mesma célula de onde arrastou — não faz nada.
    if (dataAtual === dataDestinoISO) return;
    await moverAtendimento(contratoId, dataOriginal, dataDestinoISO);
    router.refresh();
  }

  return (
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
          <div
            key={i}
            className="grid grid-cols-7 divide-x divide-brand-border border-b border-brand-border last:border-b-0"
          >
            {semana.map((dia) => {
              const dataISO = formatDataParam(dia.data);
              const foraDoMes = visao === "mes" && dia.data.getUTCMonth() !== mesRef;
              const ehHoje = dataISO === hoje;
              const emArrasteSobre = sobreData === dataISO;

              return (
                <div
                  key={dataISO}
                  onDragOver={(e) => {
                    if (!arrastando) return;
                    e.preventDefault();
                    setSobreData(dataISO);
                  }}
                  onDragLeave={() => {
                    setSobreData((atual) => (atual === dataISO ? null : atual));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    soltarEm(dataISO);
                  }}
                  className={
                    "min-h-[110px] p-2 align-top text-xs transition-colors " +
                    (emArrasteSobre
                      ? "bg-brand-orange-light"
                      : foraDoMes
                        ? "bg-brand-grey-light text-zinc-400"
                        : "text-brand-text")
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
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            setArrastando({
                              contratoId: item.contratoId,
                              dataOriginal: item.dataOriginal,
                              dataAtual: dataISO,
                            });
                          }}
                          onDragEnd={() => {
                            setArrastando(null);
                            setSobreData(null);
                          }}
                          className={
                            "cursor-grab truncate rounded bg-brand-orange-light px-1.5 py-0.5 text-brand-navy active:cursor-grabbing " +
                            (item.movido ? "ring-1 ring-inset ring-brand-orange" : "")
                          }
                          title={`Atendimento — ${item.clienteNome} (${item.contratoNumero})${
                            item.movido ? " — remarcado" : ""
                          }. Arraste para outra data para remarcar.`}
                        >
                          {item.clienteNome}
                          {item.movido && <span className="ml-1">↷</span>}
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
  );
}
