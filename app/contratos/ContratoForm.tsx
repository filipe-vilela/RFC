import Link from "next/link";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/lib/ui";
import { PERIODICIDADE, STATUS_CONTRATO } from "@/lib/enums";
import { formatDataInput } from "@/lib/format";

type ContratoDefaultValues = {
  clienteId: string;
  numero: string;
  escopo: string | null;
  valor: number;
  periodicidade: string;
  dataInicio: Date;
  dataFim: Date | null;
  status: string;
  diaAtendimento: string | null;
};

export function ContratoForm({
  action,
  defaultValues,
  clientes,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ContratoDefaultValues;
  clientes: { id: string; nome: string }[];
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className={labelClass} htmlFor="clienteId">
          Cliente *
        </label>
        <select
          id="clienteId"
          name="clienteId"
          required
          defaultValue={defaultValues?.clienteId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="numero">
            Número *
          </label>
          <input
            id="numero"
            name="numero"
            required
            defaultValue={defaultValues?.numero}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="valor">
            Valor (R$) *
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.valor}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="escopo">
          Escopo
        </label>
        <textarea
          id="escopo"
          name="escopo"
          rows={3}
          defaultValue={defaultValues?.escopo ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="periodicidade">
            Periodicidade *
          </label>
          <select
            id="periodicidade"
            name="periodicidade"
            required
            defaultValue={defaultValues?.periodicidade ?? "MENSAL"}
            className={inputClass}
          >
            {Object.entries(PERIODICIDADE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status *
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={defaultValues?.status ?? "ATIVO"}
            className={inputClass}
          >
            {Object.entries(STATUS_CONTRATO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="dataInicio">
            Data de início *
          </label>
          <input
            id="dataInicio"
            name="dataInicio"
            type="date"
            required
            defaultValue={
              defaultValues?.dataInicio
                ? formatDataInput(defaultValues.dataInicio)
                : undefined
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dataFim">
            Data de fim
          </label>
          <input
            id="dataFim"
            name="dataFim"
            type="date"
            defaultValue={
              defaultValues?.dataFim
                ? formatDataInput(defaultValues.dataFim)
                : undefined
            }
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="diaAtendimento">
          Dia de atendimento
        </label>
        <input
          id="diaAtendimento"
          name="diaAtendimento"
          placeholder="ex.: quinta-feira"
          defaultValue={defaultValues?.diaAtendimento ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Salvar
        </button>
        <Link href="/contratos" className={buttonSecondaryClass}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
