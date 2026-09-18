import { inputClass, labelClass, buttonPrimaryClass } from "@/lib/ui";
import { paramString } from "@/lib/query-params";
import { entrar } from "./actions";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const erro = paramString(params.erro);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-16">
      <h1 className="text-2xl font-semibold text-brand-navy">Gestão RFC</h1>
      <form action={entrar} className="w-full space-y-4 rounded-md border border-brand-border bg-white p-6 shadow-sm">
        <div>
          <label className={labelClass} htmlFor="senha">
            Senha de acesso
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoFocus
            required
            className={inputClass}
          />
        </div>
        {erro && <p className="text-sm text-red-700">Senha incorreta.</p>}
        <button type="submit" className={buttonPrimaryClass + " w-full"}>
          Entrar
        </button>
      </form>
    </div>
  );
}
