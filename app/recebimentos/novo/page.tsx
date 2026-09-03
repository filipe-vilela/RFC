import { prisma } from "@/lib/prisma";
import { RecebimentoForm } from "../RecebimentoForm";
import { createRecebimento } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoRecebimentoPage() {
  const contratos = await prisma.contrato.findMany({
    orderBy: { numero: "asc" },
    select: { id: true, numero: true, cliente: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo recebimento</h1>
      <RecebimentoForm action={createRecebimento} contratos={contratos} />
    </div>
  );
}
