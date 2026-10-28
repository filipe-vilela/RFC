"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/lib/ui";

export function ClienteCampo({
  clientes,
  clienteIdSelecionado,
}: {
  clientes: { id: string; nome: string }[];
  clienteIdSelecionado?: string;
}) {
  const [modo, setModo] = useState<"existente" | "novo">("existente");

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm text-brand-text">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="clienteModo"
            value="existente"
            checked={modo === "existente"}
            onChange={() => setModo("existente")}
          />
          Cliente existente
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="clienteModo"
            value="novo"
            checked={modo === "novo"}
            onChange={() => setModo("novo")}
          />
          Cadastrar novo cliente
        </label>
      </div>

      {modo === "existente" ? (
        <div>
          <label className={labelClass} htmlFor="clienteId">
            Cliente *
          </label>
          <select
            id="clienteId"
            name="clienteId"
            required
            defaultValue={clienteIdSelecionado ?? ""}
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
      ) : (
        <div className="space-y-3 rounded-md border border-brand-border bg-brand-grey-light p-3">
          <div>
            <label className={labelClass} htmlFor="clienteNovoNome">
              Nome do cliente *
            </label>
            <input
              id="clienteNovoNome"
              name="clienteNovoNome"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="clienteNovoCnpj">
              CNPJ
            </label>
            <input id="clienteNovoCnpj" name="clienteNovoCnpj" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="clienteNovoContatoNome">
                Contato
              </label>
              <input
                id="clienteNovoContatoNome"
                name="clienteNovoContatoNome"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="clienteNovoContatoTelefone">
                Telefone
              </label>
              <input
                id="clienteNovoContatoTelefone"
                name="clienteNovoContatoTelefone"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="clienteNovoContatoEmail">
              E-mail de contato
            </label>
            <input
              id="clienteNovoContatoEmail"
              name="clienteNovoContatoEmail"
              type="email"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="clienteNovoSetor">
              Setor
            </label>
            <input id="clienteNovoSetor" name="clienteNovoSetor" className={inputClass} />
          </div>
        </div>
      )}
    </div>
  );
}
