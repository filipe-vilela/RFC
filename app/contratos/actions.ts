"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { isForeignKeyConstraintError } from "@/lib/db-errors";
import { sincronizarRecebimentosAutomaticos } from "@/lib/recebimentos";
import type {
  DiaSemana,
  FrequenciaAtendimento,
  Periodicidade,
  StatusContrato,
} from "@/app/generated/prisma/client";

/** Envia o PDF do contrato assinado pro Vercel Blob, se um arquivo foi selecionado. */
async function enviarArquivoContrato(
  formData: FormData,
): Promise<{ url: string; nome: string } | null> {
  const arquivo = formData.get("arquivoContrato");
  if (!(arquivo instanceof File) || arquivo.size === 0) return null;

  const blob = await put(`contratos/${crypto.randomUUID()}-${arquivo.name}`, arquivo, {
    access: "public",
  });
  return { url: blob.url, nome: arquivo.name };
}

/** Remove um blob antigo do Vercel Blob; falha silenciosamente (não deve travar a ação principal). */
async function removerArquivoAntigo(url: string | null | undefined) {
  if (!url) return;
  await del(url).catch(() => {});
}

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
  const tipos = formData.getAll("descontoTipo");
  const percentuais = formData.getAll("descontoPercentual");
  const valoresFixos = formData.getAll("descontoValorFixo");
  const mesesInicio = formData.getAll("descontoMesInicio");
  const mesesFim = formData.getAll("descontoMesFim");

  return tipos.map((tipoRaw, i) => {
    const tipo: "PERCENTUAL" | "VALOR_FIXO" =
      String(tipoRaw) === "VALOR_FIXO" ? "VALOR_FIXO" : "PERCENTUAL";
    return {
      tipo,
      percentual: tipo === "PERCENTUAL" ? Number(percentuais[i]) : null,
      valorFixo: tipo === "VALOR_FIXO" ? Number(valoresFixos[i]) : null,
      mesInicio: Number(mesesInicio[i]),
      mesFim: Number(mesesFim[i]),
    };
  });
}

export async function createContrato(formData: FormData) {
  const data = readContratoFormData(formData);
  const clienteModo = String(formData.get("clienteModo") ?? "existente");
  const descontos = readDescontosFormData(formData);
  const arquivo = await enviarArquivoContrato(formData);

  await prisma.$transaction(async (tx) => {
    const cliente =
      clienteModo === "novo"
        ? await tx.cliente.create({ data: readNovoClienteFormData(formData) })
        : await tx.cliente.findUniqueOrThrow({
            where: { id: String(formData.get("clienteId") ?? "") },
          });

    const contrato = await tx.contrato.create({
      data: {
        ...data,
        clienteId: cliente.id,
        descontos: { create: descontos },
        arquivoContratoUrl: arquivo?.url,
        arquivoContratoNome: arquivo?.nome,
      },
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
  const removerArquivo = formData.get("removerArquivoContrato") === "on";
  const novoArquivo = await enviarArquivoContrato(formData);

  const existente = await prisma.contrato.findUniqueOrThrow({
    where: { id },
    select: { arquivoContratoUrl: true },
  });

  await prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUniqueOrThrow({ where: { id: clienteId } });
    await tx.desconto.deleteMany({ where: { contratoId: id } });
    const contrato = await tx.contrato.update({
      where: { id },
      data: {
        ...data,
        clienteId,
        descontos: { create: descontos },
        ...(novoArquivo
          ? { arquivoContratoUrl: novoArquivo.url, arquivoContratoNome: novoArquivo.nome }
          : removerArquivo
            ? { arquivoContratoUrl: null, arquivoContratoNome: null }
            : {}),
      },
    });
    await sincronizarRecebimentosAutomaticos(tx, contrato.id, {
      ...contrato,
      descontos,
      diaVencimentoCliente: cliente.diaVencimento,
    });
  });

  if (novoArquivo || removerArquivo) {
    await removerArquivoAntigo(existente.arquivoContratoUrl);
  }

  revalidatePath("/contratos");
  revalidatePath("/recebimentos");
  redirect("/contratos");
}

export async function deleteContrato(id: string) {
  let contrato;
  try {
    contrato = await prisma.contrato.delete({ where: { id } });
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
  await removerArquivoAntigo(contrato.arquivoContratoUrl);
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
