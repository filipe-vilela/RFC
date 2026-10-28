import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const nomeBusca = process.argv[2] ?? "Elson";

  const clientes = await prisma.cliente.findMany({
    where: { nome: { contains: nomeBusca, mode: "insensitive" } },
    include: {
      contratos: {
        include: { descontos: false },
      },
    },
  });

  if (clientes.length === 0) {
    console.log(`Nenhum cliente encontrado com "${nomeBusca}" no nome.`);
    return;
  }

  for (const cliente of clientes) {
    console.log(`\n=== Cliente: ${cliente.nome} (${cliente.id}) ===`);
    console.log(`Contratos (${cliente.contratos.length}):`);
    for (const c of cliente.contratos) {
      console.log(
        `  - ${c.numero} | status=${c.status} | diaAtendimento=${c.diaAtendimento} | ` +
          `frequencia=${c.frequenciaAtendimento} | dataInicio=${c.dataInicio.toISOString().slice(0, 10)} | ` +
          `dataFim=${c.dataFim?.toISOString().slice(0, 10) ?? "null"} | renovadoAte=${c.renovadoAte?.toISOString().slice(0, 10) ?? "null"} | id=${c.id}`,
      );
    }

    const contratoIds = cliente.contratos.map((c) => c.id);
    const excecoes = await prisma.atendimentoExcecao.findMany({
      where: { contratoId: { in: contratoIds } },
    });
    console.log(`AtendimentoExcecao (${excecoes.length}):`);
    for (const e of excecoes) {
      console.log(
        `  - contratoId=${e.contratoId} | dataOriginal=${e.dataOriginal.toISOString().slice(0, 10)} | dataNova=${e.dataNova.toISOString().slice(0, 10)}`,
      );
    }

    console.log(`Recebimentos por contrato:`);
    for (const c of cliente.contratos) {
      const recebimentos = await prisma.recebimento.findMany({
        where: { contratoId: c.id },
      });
      const totalPrevisto = recebimentos.reduce((soma, r) => soma + r.valorPrevisto, 0);
      const pagos = recebimentos.filter((r) => r.status === "PAGO");
      console.log(
        `  - contrato ${c.numero} (id=${c.id}): ${recebimentos.length} parcela(s), ` +
          `total previsto R$ ${totalPrevisto.toFixed(2)}, ${pagos.length} já paga(s)`,
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
