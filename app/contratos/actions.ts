"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isForeignKeyConstraintError } from "@/lib/db-errors";
import type { Periodicidade, StatusContrato } from "@/app/generated/prisma/client";

function readContratoFormData(formData: FormData) {
  const dataFimRaw = String(formData.get("dataFim") ?? "").trim();

  return {
    clienteId: String(formData.get("clienteId") ?? ""),
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

export async function createContrato(formData: FormData) {
  const data = readContratoFormData(formData);
  await prisma.contrato.create({ data });
  revalidatePath("/contratos");
  redirect("/contratos");
}

export async function updateContrato(id: string, formData: FormData) {
  const data = readContratoFormData(formData);
  await prisma.contrato.update({ where: { id }, data });
  revalidatePath("/contratos");
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
