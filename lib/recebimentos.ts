import { Prisma } from "@/app/generated/prisma/client";
import type { Periodicidade } from "@/app/generated/prisma/client";

const HORIZONTE_PADRAO_MESES = 12;

function addMeses(data: Date, meses: number): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, data.getUTCDate()),
  );
}

type ItemAgenda = { dataPrevista: Date; valorPrevisto: number };

/**
 * Monta a programação de recebimentos previstos a partir da periodicidade do
 * contrato. Contratos "por fase" não têm datas previsíveis, então ficam de
 * fora — os recebimentos desses contratos são lançados manualmente.
 */
export function montarProgramacaoRecebimentos(contrato: {
  valor: number;
  periodicidade: Periodicidade;
  dataInicio: Date;
  dataFim: Date | null;
}): ItemAgenda[] {
  const { valor, periodicidade, dataInicio, dataFim } = contrato;

  if (periodicidade === "UNICO") {
    return [{ dataPrevista: dataInicio, valorPrevisto: valor }];
  }

  if (periodicidade === "POR_FASE") {
    return [];
  }

  const intervaloMeses = periodicidade === "MENSAL" ? 1 : 3;
  const limite = dataFim ?? addMeses(dataInicio, HORIZONTE_PADRAO_MESES);

  const programacao: ItemAgenda[] = [];
  let dataAtual = dataInicio;
  while (dataAtual <= limite) {
    programacao.push({ dataPrevista: dataAtual, valorPrevisto: valor });
    dataAtual = addMeses(dataAtual, intervaloMeses);
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
