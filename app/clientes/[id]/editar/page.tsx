import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClienteForm } from "../../ClienteForm";
import { updateCliente } from "../../actions";

export const metadata = { title: "Editar cliente" };

export default async function EditarClientePage({
  params,
}: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar cliente</h1>
      <ClienteForm
        action={updateCliente.bind(null, cliente.id)}
        defaultValues={cliente}
      />
    </div>
  );
}
