"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isForeignKeyConstraintError } from "@/lib/db-errors";
import { sincronizarRecebimentosAutomaticos } from "@/lib/recebimentos";
import type { Periodicidade, StatusContrato } from "@/app/generated/prisma/client";

function readContratoFormData(formData: FormData) {
  const dataFimRaw = String(formData.get("dataFim") ?? "").trim();

  return {
    numero: String(formData.get("numero") ?? "").trim(),
    escopo: String(formData.get("escopo") ?? "").trim() || null,
    valor: Number(formData.get("valor")),
    periodicidade: String(formData.get("periodicidade")) as Periodicidade,
    dataInicio: new Date(String(formData.get("dataInicio"))),
    dataFim: dataFimRaw ? new Date(dataFimRaw) : null,
    status: String(formData.get("status")) as StatusContrato,
    diaAtendimento: String(formData.get("diaAtendimento") ?? "").trim() || null,
  };
}

function readNovoClienteFormData(formData: FormData) {
  return {
    nome: String(formData.get("clienteNovoNome") ?? "").trim(),
    cnpj: String(formData.get("clienteNovoCnpj") ?? "").trim() || null,
    contatoNome: String(formData.get("clienteNovoContatoNome") ?? "").trim() || null,
    contatoEmail: String(formData.get("clienteNovoContatoEmail") ?? "").trim() || null,
    contatoTelefone: String(formData.get("clienteNovoContatoTelefone") ?? "").trim() || null,
    setor: String(formData.get("clienteNovoSetor") ?? "").trim() || null,
  };
}

export async function createContrato(formData: FormData) {
  const data = readContratoFormData(formData);
  const clienteModo = String(formData.get("clienteModo") ?? "existente");

  await prisma.$transaction(async (tx) => {
    const clienteId =
      clienteModo === "novo"
        ? (await tx.cliente.create({ data: readNovoClienteFormData(formData) })).id
        : String(formData.get("clienteId") ?? "");

    const contrato = await tx.contrato.create({ data: { ...data, clienteId } });
    await sincronizarRecebimentosAutomaticos(tx, contrato.id, contrato);
  });

  revalidatePath("/contratos");
  revalidatePath("/recebimentos");
  revalidatePath("/clientes");
  redirect("/contratos");
}

export async function updateContrato(id: string, formData: FormData) {
  const data = readContratoFormData(formData);
  const clienteId = String(formData.get("clienteId") ?? "");
  await prisma.$transaction(async (tx) => {
    const contrato = await tx.contrato.update({ where: { id }, data: { ...data, clienteId } });
    await sincronizarRecebimentosAutomaticos(tx, contrato.id, contrato);
  });
  revalidatePath("/contratos");
  revalidatePath("/recebimentos");
  redirect("/contratos");
}

export async function deleteContrato(id: string) {
  try {
    await prisma.contrato.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      redirect(
        "/contratos?erro=" +
          encodeURIComponent(
            "Não é possível excluir um contrato com recebimentos ou compromissos vinculados.",
          ),
      );
    }
    throw error;
  }
  revalidatePath("/contratos");
}
