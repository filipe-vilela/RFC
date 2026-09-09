import { prisma } from "@/lib/prisma";
import { ContratoForm } from "../ContratoForm";
import { createContrato } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo contrato" };

export default async function NovoContratoPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo contrato</h1>
      <ContratoForm action={createContrato} clientes={clientes} permitirNovoCliente />
    </div>
  );
}
