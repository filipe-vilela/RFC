import Link from "next/link";
import { inputClass, labelClass, buttonSecondaryClass } from "@/lib/ui";

type Option = { value: string; label: string };

export function FilterBar({
  action,
  cliente,
  status,
  periodo,
}: {
  action: string;
  cliente?: { options: Option[]; value: string };
  status: { options: Option[]; value: string };
  periodo?: { deValue: string; ateValue: string; label: string };
}) {
  return (
    <form
      method="GET"
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-white p-4"
    >
      {cliente && (
        <div className="w-56">
          <label className={labelClass} htmlFor="clienteId">
            Cliente
          </label>
          <select
            id="clienteId"
            name="clienteId"
            defaultValue={cliente.value}
            className={inputClass}
          >
            <option value="">Todos</option>
            {cliente.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-44">
        <label className={labelClass} htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status.value}
          className={inputClass}
        >
          <option value="">Todos</option>
          {status.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {periodo && (
        <>
          <div className="w-40">
            <label className={labelClass} htmlFor="de">
              {periodo.label} - de
            </label>
            <input
              id="de"
              name="de"
              type="date"
              defaultValue={periodo.deValue}
              className={inputClass}
            />
          </div>
          <div className="w-40">
            <label className={labelClass} htmlFor="ate">
              até
            </label>
            <input
              id="ate"
              name="ate"
              type="date"
              defaultValue={periodo.ateValue}
              className={inputClass}
            />
          </div>
        </>
      )}

      <div className="flex gap-2">
        <button type="submit" className={buttonSecondaryClass}>
          Filtrar
        </button>
        <Link href={action} className={buttonSecondaryClass}>
          Limpar
        </Link>
      </div>
    </form>
  );
}
