import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContratoForm } from "../../ContratoForm";
import { updateContrato } from "../../actions";

export const metadata = { title: "Editar contrato" };

export default async function EditarContratoPage({
  params,
}: PageProps<"/contratos/[id]/editar">) {
  const { id } = await params;
  const [contrato, clientes] = await Promise.all([
    prisma.contrato.findUnique({ where: { id } }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  if (!contrato) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar contrato</h1>
      <ContratoForm
        action={updateContrato.bind(null, contrato.id)}
        defaultValues={contrato}
        clientes={clientes}
      />
    </div>
  );
}
