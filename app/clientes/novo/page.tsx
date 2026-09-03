import { ClienteForm } from "../ClienteForm";
import { createCliente } from "../actions";

export const metadata = { title: "Novo cliente" };

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo cliente</h1>
      <ClienteForm action={createCliente} />
    </div>
  );
}
