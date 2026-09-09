import type { Prisma, StatusRecebimento } from "@/app/generated/prisma/client";

export type StatusEfetivo = "PENDENTE" | "PAGO" | "ATRASADO";

function inicioDoDiaUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

/**
 * Um recebimento só é "atrasado" se a data prevista já passou — nunca por
 * escolha manual. `ATRASADO` continua existindo no enum do banco só por
 * compatibilidade com dados antigos; daqui pra frente o status é sempre
 * derivado de `status` (pendente/pago) + `dataPrevista` x hoje.
 */
export function statusEfetivo(
  recebimento: { status: StatusRecebimento; dataPrevista: Date },
  hoje: Date = new Date(),
): StatusEfetivo {
  if (recebimento.status === "PAGO") return "PAGO";
  if (inicioDoDiaUTC(recebimento.dataPrevista) < inicioDoDiaUTC(hoje)) return "ATRASADO";
  return "PENDENTE";
}

/**
 * Traduz um filtro de status (vindo da URL) para a condição Prisma
 * equivalente, já considerando a derivação por data.
 */
export function condicaoStatusEfetivo(
  statusFiltro: string,
  hoje: Date = new Date(),
): Prisma.RecebimentoWhereInput {
  const hojeInicio = inicioDoDiaUTC(hoje);
  if (statusFiltro === "PAGO") return { status: "PAGO" };
  if (statusFiltro === "ATRASADO") {
    return { status: { in: ["PENDENTE", "ATRASADO"] }, dataPrevista: { lt: hojeInicio } };
  }
  if (statusFiltro === "PENDENTE") {
    return { status: "PENDENTE", dataPrevista: { gte: hojeInicio } };
  }
  return {};
}
