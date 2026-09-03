import Link from "next/link";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/lib/ui";
import { STATUS_COMPROMISSO, TIPO_COMPROMISSO } from "@/lib/enums";
import { formatDataInput } from "@/lib/format";

type CompromissoDefaultValues = {
  contratoId: string | null;
  titulo: string;
  descricao: string | null;
  data: Date;
  tipo: string;
  status: string;
};

export function CompromissoForm({
  action,
  defaultValues,
  contratos,
}: {
  action: (formData: FormData) => void;
  defaultValues?: CompromissoDefaultValues;
  contratos: { id: string; numero: string; cliente: { nome: string } }[];
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className={labelClass} htmlFor="titulo">
          Título *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          defaultValue={defaultValues?.titulo}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="descricao">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={3}
          defaultValue={defaultValues?.descricao ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="contratoId">
          Contrato relacionado
        </label>
        <select
          id="contratoId"
          name="contratoId"
          defaultValue={defaultValues?.contratoId ?? ""}
          className={inputClass}
        >
          <option value="">Nenhum</option>
          {contratos.map((contrato) => (
            <option key={contrato.id} value={contrato.id}>
              {contrato.numero} — {contrato.cliente.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="data">
            Data *
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={
              defaultValues?.data ? formatDataInput(defaultValues.data) : undefined
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="tipo">
            Tipo *
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            defaultValue={defaultValues?.tipo ?? "REUNIAO"}
            className={inputClass}
          >
            {Object.entries(TIPO_COMPROMISSO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
          {Object.entries(STATUS_COMPROMISSO).map(([value, label]) => (
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
        <Link href="/agenda" className={buttonSecondaryClass}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
