"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isForeignKeyConstraintError } from "@/lib/db-errors";

function readClienteFormData(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cnpj: String(formData.get("cnpj") ?? "").trim() || null,
    contatoNome: String(formData.get("contatoNome") ?? "").trim() || null,
    contatoEmail: String(formData.get("contatoEmail") ?? "").trim() || null,
    contatoTelefone:
      String(formData.get("contatoTelefone") ?? "").trim() || null,
    setor: String(formData.get("setor") ?? "").trim() || null,
    status:
      formData.get("status") === "INATIVO"
        ? ("INATIVO" as const)
        : ("ATIVO" as const),
  };
}

export async function createCliente(formData: FormData) {
  const data = readClienteFormData(formData);
  await prisma.cliente.create({ data });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateCliente(id: string, formData: FormData) {
  const data = readClienteFormData(formData);
  await prisma.cliente.update({ where: { id }, data });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function deleteCliente(id: string) {
  try {
    await prisma.cliente.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      redirect(
        "/clientes?erro=" +
          encodeURIComponent(
            "Não é possível excluir um cliente com contratos cadastrados.",
          ),
      );
    }
    throw error;
  }
  revalidatePath("/clientes");
}
