"use client";

import { useId, useState } from "react";
import { inputClass, labelClass, buttonSecondaryClass } from "@/lib/ui";
import { TIPO_DESCONTO } from "@/lib/enums";

type TipoDesconto = "PERCENTUAL" | "VALOR_FIXO";

type Linha = {
  chave: string;
  tipo: TipoDesconto;
  percentual: string;
  valorFixo: string;
  mesInicio: string;
  mesFim: string;
};

function novaLinha(): Linha {
  return {
    chave: Math.random().toString(36).slice(2),
    tipo: "PERCENTUAL",
    percentual: "",
    valorFixo: "",
    mesInicio: "",
    mesFim: "",
  };
}

export function DescontosCampo({
  defaultValue = [],
}: {
  defaultValue?: {
    tipo: string;
    percentual: number | null;
    valorFixo: number | null;
    mesInicio: number;
    mesFim: number;
  }[];
}) {
  const idBase = useId();
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    defaultValue.map((d) => ({
      chave: Math.random().toString(36).slice(2),
      tipo: d.tipo === "VALOR_FIXO" ? "VALOR_FIXO" : "PERCENTUAL",
      percentual: d.percentual != null ? String(d.percentual) : "",
      valorFixo: d.valorFixo != null ? String(d.valorFixo) : "",
      mesInicio: String(d.mesInicio),
      mesFim: String(d.mesFim),
    })),
  );

  function atualizarTipo(chave: string, tipo: TipoDesconto) {
    setLinhas((atual) => atual.map((l) => (l.chave === chave ? { ...l, tipo } : l)));
  }

  return (
    <div className="space-y-2">
      <label className={labelClass}>Descontos (opcional)</label>
      <p className="mb-2 text-xs text-brand-grey">
        Ex.: 20% do mês 1 ao 3, depois R$ 100 de desconto do mês 4 ao 6.
      </p>

      {linhas.length > 0 && (
        <div className="space-y-2">
          {linhas.map((linha, i) => (
            <div key={linha.chave} className="flex items-end gap-2">
              <div className="w-32">
                <label className={labelClass} htmlFor={`${idBase}-tipo-${i}`}>
                  Tipo
                </label>
                <select
                  id={`${idBase}-tipo-${i}`}
                  name="descontoTipo"
                  defaultValue={linha.tipo}
                  onChange={(e) => atualizarTipo(linha.chave, e.target.value as TipoDesconto)}
                  className={inputClass}
                >
                  {Object.entries(TIPO_DESCONTO).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={"w-24" + (linha.tipo === "PERCENTUAL" ? "" : " hidden")}>
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
                  required={linha.tipo === "PERCENTUAL"}
                  defaultValue={linha.percentual}
                  className={inputClass}
                />
              </div>
              <div className={"w-28" + (linha.tipo === "VALOR_FIXO" ? "" : " hidden")}>
                <label className={labelClass} htmlFor={`${idBase}-valorFixo-${i}`}>
                  Desconto (R$)
                </label>
                <input
                  id={`${idBase}-valorFixo-${i}`}
                  name="descontoValorFixo"
                  type="number"
                  step="0.01"
                  min="0"
                  required={linha.tipo === "VALOR_FIXO"}
                  defaultValue={linha.valorFixo}
                  className={inputClass}
                />
              </div>
              <div className="w-24">
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
              <div className="w-24">
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
