"use client";

import { useId, useState } from "react";
import { inputClass, labelClass, buttonSecondaryClass } from "@/lib/ui";

type Linha = { chave: string; percentual: string; mesInicio: string; mesFim: string };

function novaLinha(): Linha {
  return { chave: Math.random().toString(36).slice(2), percentual: "", mesInicio: "", mesFim: "" };
}

export function DescontosCampo({
  defaultValue = [],
}: {
  defaultValue?: { percentual: number; mesInicio: number; mesFim: number }[];
}) {
  const idBase = useId();
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    defaultValue.map((d) => ({
      chave: Math.random().toString(36).slice(2),
      percentual: String(d.percentual),
      mesInicio: String(d.mesInicio),
      mesFim: String(d.mesFim),
    })),
  );

  return (
    <div className="space-y-2">
      <label className={labelClass}>Descontos (opcional)</label>
      <p className="mb-2 text-xs text-brand-grey">
        Ex.: 20% do mês 1 ao 3, depois 10% do mês 4 ao 6.
      </p>

      {linhas.length > 0 && (
        <div className="space-y-2">
          {linhas.map((linha, i) => (
            <div key={linha.chave} className="flex items-end gap-2">
              <div className="w-24">
                <label className={labelClass} htmlFor={`${idBase}-percentual-${i}`}>
                  % desconto
                </label>
                <input
                  id={`${idBase}-percentual-${i}`}
                  name="descontoPercentual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  defaultValue={linha.percentual}
                  className={inputClass}
                />
              </div>
              <div className="w-28">
                <label className={labelClass} htmlFor={`${idBase}-mesInicio-${i}`}>
                  Do mês
                </label>
                <input
                  id={`${idBase}-mesInicio-${i}`}
                  name="descontoMesInicio"
                  type="number"
                  min="1"
                  required
                  defaultValue={linha.mesInicio}
                  className={inputClass}
                />
              </div>
              <div className="w-28">
                <label className={labelClass} htmlFor={`${idBase}-mesFim-${i}`}>
                  Até o mês
                </label>
                <input
                  id={`${idBase}-mesFim-${i}`}
                  name="descontoMesFim"
                  type="number"
                  min="1"
                  required
                  defaultValue={linha.mesFim}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => setLinhas((atual) => atual.filter((l) => l.chave !== linha.chave))}
                className={buttonSecondaryClass}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setLinhas((atual) => [...atual, novaLinha()])}
        className={buttonSecondaryClass}
      >
        + Adicionar desconto
      </button>
    </div>
  );
}
