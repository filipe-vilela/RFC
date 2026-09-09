import type { DiaSemana } from "@/app/generated/prisma/client";

export const DIAS_SEMANA_LABELS: {
  value: DiaSemana;
  index: number;
  label: string;
  abrev: string;
}[] = [
  { value: "DOMINGO", index: 0, label: "Domingo", abrev: "Dom" },
  { value: "SEGUNDA", index: 1, label: "Segunda-feira", abrev: "Seg" },
  { value: "TERCA", index: 2, label: "Terça-feira", abrev: "Ter" },
  { value: "QUARTA", index: 3, label: "Quarta-feira", abrev: "Qua" },
  { value: "QUINTA", index: 4, label: "Quinta-feira", abrev: "Qui" },
  { value: "SEXTA", index: 5, label: "Sexta-feira", abrev: "Sex" },
  { value: "SABADO", index: 6, label: "Sábado", abrev: "Sáb" },
];

const INDEX_POR_DIA = new Map(DIAS_SEMANA_LABELS.map((d) => [d.value, d.index]));

export function diaSemanaParaIndex(dia: DiaSemana | null): number | null {
  if (!dia) return null;
  return INDEX_POR_DIA.get(dia) ?? null;
}
