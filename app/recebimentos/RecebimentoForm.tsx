import Link from "next/link";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/lib/ui";
import { STATUS_RECEBIMENTO } from "@/lib/enums";
import { formatDataInput } from "@/lib/format";

type RecebimentoDefaultValues = {
  contratoId: string;
  valorPrevisto: number;
  valorRealizado: number | null;
  dataPrevista: Date;
  dataRealizada: Date | null;
  dataEmissaoNF: Date | null;
  emitirNF: boolean;
  valorNF: number | null;
  status: string;
};

const STATUS_SELECIONAVEL = { PENDENTE: STATUS_RECEBIMENTO.PENDENTE, PAGO: STATUS_RECEBIMENTO.PAGO };

export function RecebimentoForm({
  action,
  defaultValues,
  contratos,
}: {
  action: (formData: FormData) => void;
  defaultValues?: RecebimentoDefaultValues;
  contratos: { id: string; numero: string; cliente: { nome: string } }[];
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className={labelClass} htmlFor="contratoId">
          Contrato *
        </label>
        <select
          id="contratoId"
          name="contratoId"
          required
          defaultValue={defaultValues?.contratoId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Selecione um contrato
          </option>
          {contratos.map((contrato) => (
            <option key={contrato.id} value={contrato.id}>
              {contrato.numero} — {contrato.cliente.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="valorPrevisto">
            Valor previsto (R$) *
          </label>
          <input
            id="valorPrevisto"
            name="valorPrevisto"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.valorPrevisto}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="valorRealizado">
            Valor realizado (R$)
          </label>
          <input
            id="valorRealizado"
            name="valorRealizado"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.valorRealizado ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="dataPrevista">
            Data prevista *
          </label>
          <input
            id="dataPrevista"
            name="dataPrevista"
            type="date"
            required
            defaultValue={
              defaultValues?.dataPrevista
                ? formatDataInput(defaultValues.dataPrevista)
                : undefined
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dataRealizada">
            Data realizada
          </label>
          <input
            id="dataRealizada"
            name="dataRealizada"
            type="date"
            defaultValue={
              defaultValues?.dataRealizada
                ? formatDataInput(defaultValues.dataRealizada)
                : undefined
            }
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="dataEmissaoNF">
            Data de emissão da NF
          </label>
          <div className="flex items-center gap-3">
            <input
              id="dataEmissaoNF"
              name="dataEmissaoNF"
              type="date"
              defaultValue={
                defaultValues?.dataEmissaoNF
                  ? formatDataInput(defaultValues.dataEmissaoNF)
                  : undefined
              }
              className={inputClass + " flex-1"}
            />
            <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-brand-text">
              <input
                type="checkbox"
                name="emitirNF"
                defaultChecked={defaultValues?.emitirNF ?? true}
              />
              Emitir NF
            </label>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status *
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={defaultValues?.status === "ATRASADO" ? "PENDENTE" : defaultValues?.status ?? "PENDENTE"}
            className={inputClass}
          >
            {Object.entries(STATUS_SELECIONAVEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="valorNF">
          Valor da NF (R$)
        </label>
        <input
          id="valorNF"
          name="valorNF"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.valorNF ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-brand-grey">
          Deixe em branco para emitir pelo valor previsto da parcela. Preencha só quando a NF for
          por um valor parcial.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Salvar
        </button>
        <Link href="/recebimentos" className={buttonSecondaryClass}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
