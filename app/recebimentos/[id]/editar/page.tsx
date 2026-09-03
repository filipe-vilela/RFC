import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecebimentoForm } from "../../RecebimentoForm";
import { updateRecebimento } from "../../actions";

export const metadata = { title: "Editar recebimento" };

export default async function EditarRecebimentoPage({
  params,
}: PageProps<"/recebimentos/[id]/editar">) {
  const { id } = await params;
  const [recebimento, contratos] = await Promise.all([
    prisma.recebimento.findUnique({ where: { id } }),
    prisma.contrato.findMany({
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, cliente: { select: { nome: true } } },
    }),
  ]);

  if (!recebimento) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar recebimento</h1>
      <RecebimentoForm
        action={updateRecebimento.bind(null, recebimento.id)}
        defaultValues={recebimento}
        contratos={contratos}
      />
    </div>
  );
}
