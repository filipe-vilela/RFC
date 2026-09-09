import { Prisma } from "@/app/generated/prisma/client";
import type { Periodicidade } from "@/app/generated/prisma/client";

const HORIZONTE_PADRAO_MESES = 12;

function addMeses(data: Date, meses: number): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, data.getUTCDate()),
  );
}

/** Dia informado, ajustado para o último dia do mês se ele não existir (ex.: 31 em fevereiro). */
function calcularDataEmissaoNF(dataPrevista: Date, diaVencimento: number | null | undefined): Date | null {
  if (!diaVencimento) return null;
  const ano = dataPrevista.getUTCFullYear();
  const mes = dataPrevista.getUTCMonth();
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(diaVencimento, ultimoDiaDoMes)));
}

type DescontoContrato = { percentual: number; mesInicio: number; mesFim: number };

type ItemAgenda = { dataPrevista: Date; valorPrevisto: number; dataEmissaoNF: Date | null };

function aplicarDesconto(
  valor: number,
  mesDaParcela: number,
  descontos: DescontoContrato[],
): number {
  const desconto = descontos.find(
    (d) => mesDaParcela >= d.mesInicio && mesDaParcela <= d.mesFim,
  );
  if (!desconto) return valor;
  return Math.round(valor * (1 - desconto.percentual / 100) * 100) / 100;
}

/**
 * Monta a programação de recebimentos previstos a partir da periodicidade do
 * contrato. Contratos "por fase" não têm datas previsíveis, então ficam de
 * fora — os recebimentos desses contratos são lançados manualmente.
 *
 * `mesDaParcela` (usado para casar com os `descontos`) é sempre contado em
 * meses corridos desde `dataInicio`, mesmo para periodicidade trimestral ou
 * anual — assim "20% nos 3 primeiros meses" cobre certinho a 1ª parcela
 * trimestral, e "10% do 4º ao 6º mês" cobre a 2ª.
 *
 * `diaVencimentoCliente` (cadastrado no Cliente) preenche a data de emissão
 * de NF de cada parcela automaticamente, usando o mês da própria parcela —
 * assim o usuário não precisa digitar isso parcela por parcela.
 */
export function montarProgramacaoRecebimentos(contrato: {
  valor: number;
  periodicidade: Periodicidade;
  dataInicio: Date;
  dataFim: Date | null;
  renovadoAte?: Date | null;
  descontos?: DescontoContrato[];
  diaVencimentoCliente?: number | null;
}): ItemAgenda[] {
  const { valor, periodicidade, dataInicio, dataFim, diaVencimentoCliente } = contrato;
  const descontos = contrato.descontos ?? [];

  if (periodicidade === "UNICO") {
    return [
      {
        dataPrevista: dataInicio,
        valorPrevisto: aplicarDesconto(valor, 1, descontos),
        dataEmissaoNF: calcularDataEmissaoNF(dataInicio, diaVencimentoCliente),
      },
    ];
  }

  if (periodicidade === "POR_FASE") {
    return [];
  }

  const intervaloMeses =
    periodicidade === "TRIMESTRAL" ? 3 : periodicidade === "ANUAL" ? 12 : 1;
  const limite = dataFim ?? contrato.renovadoAte ?? addMeses(dataInicio, HORIZONTE_PADRAO_MESES);

  const programacao: ItemAgenda[] = [];
  let mesDaParcela = 1;
  let dataAtual = dataInicio;
  while (dataAtual <= limite) {
    programacao.push({
      dataPrevista: dataAtual,
      valorPrevisto: aplicarDesconto(valor, mesDaParcela, descontos),
      dataEmissaoNF: calcularDataEmissaoNF(dataAtual, diaVencimentoCliente),
    });
    dataAtual = addMeses(dataAtual, intervaloMeses);
    mesDaParcela += intervaloMeses;
  }
  return programacao;
}

/**
 * Sincroniza os recebimentos gerados automaticamente de um contrato com a
 * programação atual. Recebimentos já pagos nunca são alterados ou removidos
 * — preservam o histórico mesmo que o contrato seja editado depois. Também
 * nunca toca em recebimentos lançados manualmente.
 */
export async function sincronizarRecebimentosAutomaticos(
  tx: Prisma.TransactionClient,
  contratoId: string,
  contrato: {
    valor: number;
    periodicidade: Periodicidade;
    dataInicio: Date;
    dataFim: Date | null;
    renovadoAte?: Date | null;
    descontos?: DescontoContrato[];
    diaVencimentoCliente?: number | null;
  },
) {
  const programacao = montarProgramacaoRecebimentos(contrato);
  const existentes = await tx.recebimento.findMany({
    where: { contratoId, origem: "GERADO_AUTOMATICAMENTE" },
  });
  const existentesPorData = new Map(
    existentes.map((r) => [r.dataPrevista.toISOString(), r]),
  );

  const idsParaManter = new Set<string>();
  const novos: Prisma.RecebimentoCreateManyInput[] = [];

  for (const item of programacao) {
    const existente = existentesPorData.get(item.dataPrevista.toISOString());
    if (existente) {
      idsParaManter.add(existente.id);
      if (existente.status !== "PAGO") {
        const atualizacao: Prisma.RecebimentoUpdateInput = {};
        if (existente.valorPrevisto !== item.valorPrevisto) {
          atualizacao.valorPrevisto = item.valorPrevisto;
        }
        // Só preenche a NF automaticamente se ainda não houver uma data
        // definida — nunca sobrescreve um ajuste manual do usuário.
        if (existente.dataEmissaoNF === null && item.dataEmissaoNF !== null) {
          atualizacao.dataEmissaoNF = item.dataEmissaoNF;
        }
        if (Object.keys(atualizacao).length > 0) {
          await tx.recebimento.update({ where: { id: existente.id }, data: atualizacao });
        }
      }
    } else {
      novos.push({
        contratoId,
        dataPrevista: item.dataPrevista,
        valorPrevisto: item.valorPrevisto,
        dataEmissaoNF: item.dataEmissaoNF,
        status: "PENDENTE",
        origem: "GERADO_AUTOMATICAMENTE",
      });
    }
  }

  const idsParaRemover = existentes
    .filter((r) => !idsParaManter.has(r.id) && r.status !== "PAGO")
    .map((r) => r.id);

  if (idsParaRemover.length > 0) {
    await tx.recebimento.deleteMany({ where: { id: { in: idsParaRemover } } });
  }
  if (novos.length > 0) {
    await tx.recebimento.createMany({ data: novos });
  }
}
