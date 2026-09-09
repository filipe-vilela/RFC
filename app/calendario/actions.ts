"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Move a ocorrência de atendimento de um contrato (identificada pela data em
 * que ela ocorreria pela regra normal, `dataOriginal`) para outra data,
 * sem alterar o dia/frequência cadastrados no contrato — usado para
 * remarcações avulsas a pedido do cliente (arrastar-e-soltar no
 * calendário). Se a nova data for igual à original, a exceção é removida
 * (volta a ocorrer normalmente).
 */
export async function moverAtendimento(
  contratoId: string,
  dataOriginalISO: string,
  dataNovaISO: string,
) {
  const dataOriginal = new Date(dataOriginalISO);
  const dataNova = new Date(dataNovaISO);

  if (dataOriginal.getTime() === dataNova.getTime()) {
    await prisma.atendimentoExcecao.deleteMany({
      where: { contratoId, dataOriginal },
    });
  } else {
    await prisma.atendimentoExcecao.upsert({
      where: { contratoId_dataOriginal: { contratoId, dataOriginal } },
      create: { contratoId, dataOriginal, dataNova },
      update: { dataNova },
    });
  }

  revalidatePath("/calendario");
}
