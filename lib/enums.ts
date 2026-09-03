export const STATUS_CLIENTE = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
} as const;

export const PERIODICIDADE = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  UNICO: "Único",
  POR_FASE: "Por fase",
} as const;

export const STATUS_CONTRATO = {
  ATIVO: "Ativo",
  ENCERRADO: "Encerrado",
  SUSPENSO: "Suspenso",
} as const;

export const STATUS_RECEBIMENTO = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
} as const;

export const ORIGEM_RECEBIMENTO = {
  GERADO_AUTOMATICAMENTE: "Gerado automaticamente",
  LANCADO_MANUALMENTE: "Lançado manualmente",
} as const;

export const TIPO_COMPROMISSO = {
  ENTREGA: "Entrega",
  REUNIAO: "Reunião",
  PRAZO_INTERNO: "Prazo interno",
  ATENDIMENTO_RECORRENTE: "Atendimento recorrente",
} as const;

export const STATUS_COMPROMISSO = {
  PENDENTE: "Pendente",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
} as const;
