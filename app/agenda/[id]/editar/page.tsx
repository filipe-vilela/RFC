import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompromissoForm } from "../../CompromissoForm";
import { updateCompromisso } from "../../actions";

export default async function EditarCompromissoPage({
  params,
}: PageProps<"/agenda/[id]/editar">) {
  const { id } = await params;
  const [compromisso, contratos] = await Promise.all([
    prisma.compromisso.findUnique({ where: { id } }),
    prisma.contrato.findMany({
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, cliente: { select: { nome: true } } },
    }),
  ]);

  if (!compromisso) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar compromisso</h1>
      <CompromissoForm
        action={updateCompromisso.bind(null, compromisso.id)}
        defaultValues={compromisso}
        contratos={contratos}
      />
    </div>
  );
}
