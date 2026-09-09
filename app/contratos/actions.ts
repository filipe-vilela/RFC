"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isForeignKeyConstraintError } from "@/lib/db-errors";
import { sincronizarRecebimentosAutomaticos } from "@/lib/recebimentos";
import type {
  DiaSemana,
  FrequenciaAtendimento,
  Periodicidade,
  StatusContrato,
} from "@/app/generated/prisma/client";

function readContratoFormData(formData: FormData) {
  const dataFimRaw = String(formData.get("dataFim") ?? "").trim();
  const diaAtendimentoRaw = String(formData.get("diaAtendimento") ?? "").trim();

  return {
    numero: String(formData.get("numero") ?? "").trim(),
    escopo: String(formData.get("escopo") ?? "").trim() || null,
    valor: Number(formData.get("valor")),
    periodicidade: String(formData.get("periodicidade")) as Periodicidade,
    dataInicio: new Date(String(formData.get("dataInicio"))),
    dataFim: dataFimRaw ? new Date(dataFimRaw) : null,
    status: String(formData.get("status")) as StatusContrato,
    diaAtendimento: (diaAtendimentoRaw || null) as DiaSemana | null,
    frequenciaAtendimento: String(
      formData.get("frequenciaAtendimento") ?? "SEMANAL",
    ) as FrequenciaAtendimento,
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

function readDescontosFormData(formData: FormData) {
  const percentuais = formData.getAll("descontoPercentual");
  const mesesInicio = formData.getAll("descontoMesInicio");
  const mesesFim = formData.getAll("descontoMesFim");

  return percentuais.map((percentual, i) => ({
    percentual: Number(percentual),
    mesInicio: Number(mesesInicio[i]),
    mesFim: Number(mesesFim[i]),
  }));
}

export async function createContrato(formData: FormData) {
  const data = readContratoFormData(formData);
  const clienteModo = String(formData.get("clienteModo") ?? "existente");
  const descontos = readDescontosFormData(formData);

  await prisma.$transaction(async (tx) => {
    const cliente =
      clienteModo === "novo"
        ? await tx.cliente.create({ data: readNovoClienteFormData(formData) })
        : await tx.cliente.findUniqueOrThrow({
            where: { id: String(formData.get("clienteId") ?? "") },
          });

    const contrato = await tx.contrato.create({
      data: { ...data, clienteId: cliente.id, descontos: { create: descontos } },
    });
    await sincronizarRecebimentosAutomaticos(tx, contrato.id, {
      ...contrato,
      descontos,
      diaVencimentoCliente: cliente.diaVencimento,
    });
  });

  revalidatePath("/contratos");
  revalidatePath("/recebimentos");
  revalidatePath("/clientes");
  redirect("/contratos");
}

export async function updateContrato(id: string, formData: FormData) {
  const data = readContratoFormData(formData);
  const clienteId = String(formData.get("clienteId") ?? "");
  const descontos = readDescontosFormData(formData);

  await prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUniqueOrThrow({ where: { id: clienteId } });
    await tx.desconto.deleteMany({ where: { contratoId: id } });
    const contrato = await tx.contrato.update({
      where: { id },
      data: { ...data, clienteId, descontos: { create: descontos } },
    });
    await sincronizarRecebimentosAutomaticos(tx, contrato.id, {
      ...contrato,
      descontos,
      diaVencimentoCliente: cliente.diaVencimento,
    });
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

/**
 * Estende o horizonte de geração de recebimentos por mais 12 meses a partir
 * de hoje (ou do fim do horizonte atual, se ele ainda não tiver chegado).
 * Só faz sentido para contratos sem dataFim (mensal/trimestral/anual/
 * indeterminado "rolando" sem prazo fixo).
 */
export async function renovarContrato(id: string) {
  await prisma.$transaction(async (tx) => {
    const contrato = await tx.contrato.findUniqueOrThrow({
      where: { id },
      include: { descontos: true, cliente: true },
    });

    const hoje = new Date();
    const horizonteAtual = contrato.renovadoAte ?? contrato.dataInicio;
    const baseParaRenovar = horizonteAtual > hoje ? horizonteAtual : hoje;
    const renovadoAte = new Date(
      Date.UTC(
        baseParaRenovar.getUTCFullYear(),
        baseParaRenovar.getUTCMonth() + 12,
        baseParaRenovar.getUTCDate(),
      ),
    );

    const contratoAtualizado = await tx.contrato.update({
      where: { id },
      data: { renovadoAte },
    });
    await sincronizarRecebimentosAutomaticos(tx, id, {
      ...contratoAtualizado,
      descontos: contrato.descontos,
      diaVencimentoCliente: contrato.cliente.diaVencimento,
    });
  });

  revalidatePath("/contratos");
  revalidatePath("/recebimentos");
}
