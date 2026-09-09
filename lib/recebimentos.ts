import { Prisma } from "@/app/generated/prisma/client";
import type { Periodicidade } from "@/app/generated/prisma/client";

const HORIZONTE_PADRAO_MESES = 12;

function addMeses(data: Date, meses: number): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, data.getUTCDate()),
  );
}

type DescontoContrato = { percentual: number; mesInicio: number; mesFim: number };

type ItemAgenda = { dataPrevista: Date; valorPrevisto: number };

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
 */
export function montarProgramacaoRecebimentos(contrato: {
  valor: number;
  periodicidade: Periodicidade;
  dataInicio: Date;
  dataFim: Date | null;
  renovadoAte?: Date | null;
  descontos?: DescontoContrato[];
}): ItemAgenda[] {
  const { valor, periodicidade, dataInicio, dataFim } = contrato;
  const descontos = contrato.descontos ?? [];

  if (periodicidade === "UNICO") {
    return [{ dataPrevista: dataInicio, valorPrevisto: aplicarDesconto(valor, 1, descontos) }];
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
      if (existente.status !== "PAGO" && existente.valorPrevisto !== item.valorPrevisto) {
        await tx.recebimento.update({
          where: { id: existente.id },
          data: { valorPrevisto: item.valorPrevisto },
        });
      }
    } else {
      novos.push({
        contratoId,
        dataPrevista: item.dataPrevista,
        valorPrevisto: item.valorPrevisto,
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
