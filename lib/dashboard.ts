import { prisma } from "@/lib/prisma";

function inicioDoDiaUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

export async function getDashboardData() {
  const agora = new Date();
  const hoje = inicioDoDiaUTC(agora);
  const inicioMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));
  const inicioProximoMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + 1, 1));

  const [recebimentosDoMes, contratosAtivos, inadimplentes, proximosPrazos] =
    await Promise.all([
      prisma.recebimento.findMany({
        where: { dataPrevista: { gte: inicioMes, lt: inicioProximoMes } },
      }),
      prisma.contrato.count({ where: { status: "ATIVO" } }),
      prisma.recebimento.findMany({
        where: {
          OR: [
            { status: "ATRASADO" },
            { status: "PENDENTE", dataPrevista: { lt: hoje } },
          ],
        },
        include: { contrato: { include: { cliente: true } } },
        orderBy: { dataPrevista: "asc" },
      }),
      prisma.compromisso.findMany({
        where: { status: "PENDENTE", data: { gte: hoje } },
        include: { contrato: { include: { cliente: true } } },
        orderBy: { data: "asc" },
        take: 8,
      }),
    ]);

  const totalPrevistoNoMes = recebimentosDoMes.reduce(
    (soma, r) => soma + r.valorPrevisto,
    0,
  );
  const totalRecebidoNoMes = recebimentosDoMes
    .filter((r) => r.status === "PAGO")
    .reduce((soma, r) => soma + (r.valorRealizado ?? 0), 0);
  const totalInadimplente = inadimplentes.reduce(
    (soma, r) => soma + r.valorPrevisto,
    0,
  );

  return {
    totalPrevistoNoMes,
    totalRecebidoNoMes,
    contratosAtivos,
    inadimplentes,
    totalInadimplente,
    proximosPrazos,
  };
}
