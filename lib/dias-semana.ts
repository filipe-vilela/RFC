const DIAS_SEMANA: { index: number; chave: string; label: string; abrev: string }[] = [
  { index: 0, chave: "domingo", label: "Domingo", abrev: "Dom" },
  { index: 1, chave: "segunda", label: "Segunda-feira", abrev: "Seg" },
  { index: 2, chave: "terca", label: "Terça-feira", abrev: "Ter" },
  { index: 3, chave: "quarta", label: "Quarta-feira", abrev: "Qua" },
  { index: 4, chave: "quinta", label: "Quinta-feira", abrev: "Qui" },
  { index: 5, chave: "sexta", label: "Sexta-feira", abrev: "Sex" },
  { index: 6, chave: "sabado", label: "Sábado", abrev: "Sáb" },
];

export const DIAS_SEMANA_LABELS = DIAS_SEMANA;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * `diaAtendimento` é texto livre (ex.: "quinta-feira", "Quinta", "sexta").
 * Casamos por substring normalizada (sem acento) contra os nomes dos dias da
 * semana em português, então variações razoáveis de escrita funcionam.
 */
export function diaSemanaIndex(diaAtendimento: string | null): number | null {
  if (!diaAtendimento) return null;
  const normalizado = normalizar(diaAtendimento);
  const encontrado = DIAS_SEMANA.find((d) => normalizado.includes(d.chave));
  return encontrado ? encontrado.index : null;
}
