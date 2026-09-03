"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { StatusRecebimento } from "@/app/generated/prisma/client";

function readRecebimentoFormData(formData: FormData) {
  const dataRealizadaRaw = String(formData.get("dataRealizada") ?? "").trim();
  const valorRealizadoRaw = String(formData.get("valorRealizado") ?? "").trim();

  return {
    contratoId: String(formData.get("contratoId") ?? ""),
    valorPrevisto: Number(formData.get("valorPrevisto")),
    valorRealizado: valorRealizadoRaw ? Number(valorRealizadoRaw) : null,
    dataPrevista: new Date(String(formData.get("dataPrevista"))),
    dataRealizada: dataRealizadaRaw ? new Date(dataRealizadaRaw) : null,
    status: String(formData.get("status")) as StatusRecebimento,
  };
}

export async function createRecebimento(formData: FormData) {
  const data = readRecebimentoFormData(formData);
  await prisma.recebimento.create({
    data: { ...data, origem: "LANCADO_MANUALMENTE" },
  });
  revalidatePath("/recebimentos");
  redirect("/recebimentos");
}

export async function updateRecebimento(id: string, formData: FormData) {
  const data = readRecebimentoFormData(formData);
  await prisma.recebimento.update({ where: { id }, data });
  revalidatePath("/recebimentos");
  redirect("/recebimentos");
}

export async function deleteRecebimento(id: string) {
  await prisma.recebimento.delete({ where: { id } });
  revalidatePath("/recebimentos");
}

export async function marcarComoPago(id: string) {
  const recebimento = await prisma.recebimento.findUniqueOrThrow({
    where: { id },
  });
  await prisma.recebimento.update({
    where: { id },
    data: {
      status: "PAGO",
      dataRealizada: new Date(),
      valorRealizado: recebimento.valorRealizado ?? recebimento.valorPrevisto,
    },
  });
  revalidatePath("/recebimentos");
}
