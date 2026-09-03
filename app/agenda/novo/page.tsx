import { prisma } from "@/lib/prisma";
import { CompromissoForm } from "../CompromissoForm";
import { createCompromisso } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo compromisso" };

export default async function NovoCompromissoPage() {
  const contratos = await prisma.contrato.findMany({
    orderBy: { numero: "asc" },
    select: { id: true, numero: true, cliente: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo compromisso</h1>
      <CompromissoForm action={createCompromisso} contratos={contratos} />
    </div>
  );
}
