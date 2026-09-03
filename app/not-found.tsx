import Link from "next/link";
import { linkClass } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <p className="font-serif text-5xl text-brand-navy">404</p>
      <h1 className="text-xl">Página não encontrada</h1>
      <p className="text-brand-grey">
        O endereço acessado não existe ou o registro foi removido.
      </p>
      <p>
        <Link href="/" className={linkClass}>
          Voltar para o Dashboard
        </Link>
      </p>
    </div>
  );
}
