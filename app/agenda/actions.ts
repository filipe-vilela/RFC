"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type {
  StatusCompromisso,
  TipoCompromisso,
} from "@/app/generated/prisma/client";

function readCompromissoFormData(formData: FormData) {
  const contratoId = String(formData.get("contratoId") ?? "").trim();

  return {
    contratoId: contratoId || null,
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    data: new Date(String(formData.get("data"))),
    tipo: String(formData.get("tipo")) as TipoCompromisso,
    status: String(formData.get("status")) as StatusCompromisso,
  };
}

export async function createCompromisso(formData: FormData) {
  const data = readCompromissoFormData(formData);
  await prisma.compromisso.create({ data });
  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function updateCompromisso(id: string, formData: FormData) {
  const data = readCompromissoFormData(formData);
  await prisma.compromisso.update({ where: { id }, data });
  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function deleteCompromisso(id: string) {
  await prisma.compromisso.delete({ where: { id } });
  revalidatePath("/agenda");
}
