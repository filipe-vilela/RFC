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
  status: string;
};

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

      <div>
        <label className={labelClass} htmlFor="status">
          Status *
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue={defaultValues?.status ?? "PENDENTE"}
          className={inputClass}
        >
          {Object.entries(STATUS_RECEBIMENTO).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
