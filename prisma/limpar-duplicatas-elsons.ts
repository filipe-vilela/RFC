import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Contratos "012/2026" duplicados do cliente ELSON'S (segunda-feira) —
// mantém o de terça-feira (cmvs2fk2w000008k3pin9ywmt), confirmado com o usuário.
const CONTRATOS_PARA_EXCLUIR = [
  "cmvs2flqy000408k31lvew9nc",
  "cmvs2fmqs000808k3haa4t2zu",
  "cmvs2fnm4000c08k37ael1kkg",
];

async function main() {
  const confirmar = process.argv.includes("--confirmar");

  const contratos = await prisma.contrato.findMany({
    where: { id: { in: CONTRATOS_PARA_EXCLUIR } },
    include: { recebimentos: true, descontos: true },
  });

  if (contratos.length === 0) {
    console.log("Nenhum dos contratos informados foi encontrado — nada a fazer.");
    return;
  }

  console.log(`${confirmar ? "EXCLUINDO" : "PREVIEW (nada será apagado ainda)"}:\n`);
  for (const c of contratos) {
    const pagos = c.recebimentos.filter((r) => r.status === "PAGO");
    console.log(
      `Contrato ${c.numero} (id=${c.id}): ${c.recebimentos.length} recebimento(s), ` +
        `${pagos.length} já pago(s), ${c.descontos.length} desconto(s)`,
    );
    if (pagos.length > 0) {
      console.log(
        `  ATENÇÃO: este contrato tem recebimento(s) PAGO(s) — não deveria ser excluído sem rever antes.`,
      );
    }
  }

  const temPagoEmAlgum = contratos.some((c) => c.recebimentos.some((r) => r.status === "PAGO"));
  if (temPagoEmAlgum) {
    console.log(
      "\nParando aqui: pelo menos um dos contratos tem recebimento pago. Revise manualmente antes de excluir.",
    );
    return;
  }

  if (!confirmar) {
    console.log(
      `\nNenhum recebimento pago encontrado. Pra executar de verdade, rode de novo com --confirmar:\n` +
        `  npx tsx prisma/limpar-duplicatas-elsons.ts --confirmar`,
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.recebimento.deleteMany({
      where: { contratoId: { in: CONTRATOS_PARA_EXCLUIR } },
    });
    await tx.desconto.deleteMany({
      where: { contratoId: { in: CONTRATOS_PARA_EXCLUIR } },
    });
    await tx.contrato.deleteMany({
      where: { id: { in: CONTRATOS_PARA_EXCLUIR } },
    });
  });

  console.log(`\nExcluído(s) ${contratos.length} contrato(s) duplicado(s) e seus recebimentos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
