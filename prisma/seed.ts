import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const clienteA = await prisma.cliente.create({
    data: {
      nome: "Alfa Comércio de Alimentos Ltda",
      cnpj: "12.345.678/0001-90",
      contatoNome: "Marina Souza",
      contatoEmail: "marina@alfacomercio.com.br",
      setor: "Varejo alimentício",
      status: "ATIVO",
    },
  });

  const clienteB = await prisma.cliente.create({
    data: {
      nome: "Beta Indústria Metalúrgica S.A.",
      cnpj: "98.765.432/0001-10",
      contatoNome: "Roberto Lima",
      contatoEmail: "roberto@betaindustria.com.br",
      setor: "Indústria metalúrgica",
      status: "ATIVO",
    },
  });

  const clienteC = await prisma.cliente.create({
    data: {
      nome: "Gama Serviços Contábeis",
      contatoNome: "Fernanda Alves",
      setor: "Serviços",
      status: "INATIVO",
    },
  });

  const contratoA = await prisma.contrato.create({
    data: {
      clienteId: clienteA.id,
      numero: "CT-2026-001",
      escopo: "Consultoria financeira mensal",
      valor: 3500,
      periodicidade: "MENSAL",
      dataInicio: new Date("2026-01-01"),
      dataFim: new Date("2026-12-31"),
      status: "ATIVO",
      diaAtendimento: "quinta-feira",
    },
  });

  const contratoB = await prisma.contrato.create({
    data: {
      clienteId: clienteB.id,
      numero: "CT-2026-002",
      escopo: "Auditoria trimestral",
      valor: 12000,
      periodicidade: "TRIMESTRAL",
      dataInicio: new Date("2026-02-01"),
      status: "ATIVO",
      diaAtendimento: "segunda-feira",
    },
  });

  await prisma.contrato.create({
    data: {
      clienteId: clienteC.id,
      numero: "CT-2025-014",
      escopo: "Diagnóstico único de processos",
      valor: 8000,
      periodicidade: "UNICO",
      dataInicio: new Date("2025-10-01"),
      dataFim: new Date("2025-10-31"),
      status: "ENCERRADO",
    },
  });

  await prisma.recebimento.create({
    data: {
      contratoId: contratoA.id,
      valorPrevisto: 3500,
      dataPrevista: new Date("2026-09-05"),
      status: "PENDENTE",
      origem: "GERADO_AUTOMATICAMENTE",
    },
  });

  await prisma.recebimento.create({
    data: {
      contratoId: contratoA.id,
      valorPrevisto: 3500,
      valorRealizado: 3500,
      dataPrevista: new Date("2026-08-05"),
      dataRealizada: new Date("2026-08-04"),
      status: "PAGO",
      origem: "GERADO_AUTOMATICAMENTE",
    },
  });

  await prisma.recebimento.create({
    data: {
      contratoId: contratoB.id,
      valorPrevisto: 12000,
      dataPrevista: new Date("2026-08-01"),
      status: "ATRASADO",
      origem: "GERADO_AUTOMATICAMENTE",
    },
  });

  await prisma.compromisso.create({
    data: {
      contratoId: contratoA.id,
      titulo: "Atendimento semanal - Alfa Comércio",
      data: new Date("2026-09-10"),
      tipo: "ATENDIMENTO_RECORRENTE",
      status: "PENDENTE",
    },
  });

  await prisma.compromisso.create({
    data: {
      contratoId: contratoB.id,
      titulo: "Reunião de fechamento trimestral",
      descricao: "Apresentação do relatório de auditoria",
      data: new Date("2026-09-15"),
      tipo: "REUNIAO",
      status: "PENDENTE",
    },
  });

  await prisma.compromisso.create({
    data: {
      titulo: "Prazo interno - entrega de folha de pagamento",
      data: new Date("2026-09-07"),
      tipo: "PRAZO_INTERNO",
      status: "PENDENTE",
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
