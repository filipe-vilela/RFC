import { prisma } from "@/lib/prisma";
import { diaSemanaIndex } from "@/lib/dias-semana";
import type { StatusCompromisso, TipoCompromisso } from "@/app/generated/prisma/client";

export type VisaoCalendario = "mes" | "semana";

export type ItemCalendario =
  | {
      tipo: "atendimento";
      contratoId: string;
      contratoNumero: string;
      clienteNome: string;
    }
  | {
      tipo: "compromisso";
      compromissoId: string;
      titulo: string;
      tipoCompromisso: TipoCompromisso;
      status: StatusCompromisso;
      clienteNome: string | null;
    };

export type DiaCalendario = {
  data: Date;
  itens: ItemCalendario[];
};

function inicioDoDiaUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

function addDias(data: Date, dias: number): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate() + dias));
}

function inicioSemana(data: Date): Date {
  const dia = inicioDoDiaUTC(data);
  return addDias(dia, -dia.getUTCDay());
}

export function inicioMes(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1));
}

export function addMeses(data: Date, meses: number): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, 1));
}

export function addSemanas(data: Date, semanas: number): Date {
  return addDias(data, semanas * 7);
}

export function ultimoDiaMes(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0));
}

/** Calcula o intervalo [início, fim) de dias a renderizar na grade. */
export function calcularIntervaloGrade(visao: VisaoCalendario, dataRef: Date) {
  const hoje = inicioDoDiaUTC(dataRef);

  if (visao === "semana") {
    const inicio = inicioSemana(hoje);
    return { inicio, fim: addDias(inicio, 7) };
  }

  const primeiroDiaDoMes = inicioMes(hoje);
  const inicio = inicioSemana(primeiroDiaDoMes);
  const fim = addDias(inicioSemana(ultimoDiaMes(hoje)), 7);
  return { inicio, fim };
}

export async function getDadosCalendario(visao: VisaoCalendario, dataRef: Date) {
  const { inicio, fim } = calcularIntervaloGrade(visao, dataRef);

  const [contratosAtivos, compromissos] = await Promise.all([
    prisma.contrato.findMany({
      where: { status: "ATIVO", diaAtendimento: { not: null } },
      include: { cliente: true },
    }),
    prisma.compromisso.findMany({
      where: { data: { gte: inicio, lt: fim } },
      include: { contrato: { include: { cliente: true } } },
      orderBy: { data: "asc" },
    }),
  ]);

  const contratosSemDiaReconhecido = contratosAtivos.filter(
    (c) => diaSemanaIndex(c.diaAtendimento) === null,
  );

  const dias: DiaCalendario[] = [];
  for (let cursor = inicio; cursor < fim; cursor = addDias(cursor, 1)) {
    const diaSemana = cursor.getUTCDay();
    const itens: ItemCalendario[] = [];

    for (const contrato of contratosAtivos) {
      if (diaSemanaIndex(contrato.diaAtendimento) !== diaSemana) continue;
      if (cursor < inicioDoDiaUTC(contrato.dataInicio)) continue;
      if (contrato.dataFim && cursor > inicioDoDiaUTC(contrato.dataFim)) continue;
      itens.push({
        tipo: "atendimento",
        contratoId: contrato.id,
        contratoNumero: contrato.numero,
        clienteNome: contrato.cliente.nome,
      });
    }

    for (const compromisso of compromissos) {
      if (inicioDoDiaUTC(compromisso.data).getTime() !== cursor.getTime()) continue;
      itens.push({
        tipo: "compromisso",
        compromissoId: compromisso.id,
        titulo: compromisso.titulo,
        tipoCompromisso: compromisso.tipo,
        status: compromisso.status,
        clienteNome: compromisso.contrato?.cliente.nome ?? null,
      });
    }

    dias.push({ data: cursor, itens });
  }

  return { inicio, fim, dias, contratosSemDiaReconhecido };
}
