import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/lib/ui";
import { STATUS_CLIENTE } from "@/lib/enums";
import Link from "next/link";

type ClienteDefaultValues = {
  nome: string;
  cnpj: string | null;
  contatoNome: string | null;
  contatoEmail: string | null;
  contatoTelefone: string | null;
  setor: string | null;
  diaVencimento: number | null;
  status: string;
};

export function ClienteForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ClienteDefaultValues;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className={labelClass} htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={defaultValues?.nome}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="cnpj">
          CNPJ
        </label>
        <input
          id="cnpj"
          name="cnpj"
          defaultValue={defaultValues?.cnpj ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="contatoNome">
            Contato
          </label>
          <input
            id="contatoNome"
            name="contatoNome"
            defaultValue={defaultValues?.contatoNome ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contatoTelefone">
            Telefone
          </label>
          <input
            id="contatoTelefone"
            name="contatoTelefone"
            defaultValue={defaultValues?.contatoTelefone ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="contatoEmail">
          E-mail de contato
        </label>
        <input
          id="contatoEmail"
          name="contatoEmail"
          type="email"
          defaultValue={defaultValues?.contatoEmail ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="setor">
            Setor
          </label>
          <input
            id="setor"
            name="setor"
            defaultValue={defaultValues?.setor ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "ATIVO"}
            className={inputClass}
          >
            {Object.entries(STATUS_CLIENTE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="diaVencimento">
          Dia de vencimento da NF
        </label>
        <input
          id="diaVencimento"
          name="diaVencimento"
          type="number"
          min="1"
          max="31"
          placeholder="ex.: 10"
          defaultValue={defaultValues?.diaVencimento ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-brand-grey">
          Dia do mês usado para preencher automaticamente a data de emissão
          de NF dos recebimentos deste cliente.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Salvar
        </button>
        <Link href="/clientes" className={buttonSecondaryClass}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
