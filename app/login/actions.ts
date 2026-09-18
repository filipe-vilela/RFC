"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, senhaCorreta, tokenSessaoEsperado } from "@/lib/auth";

export async function entrar(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");

  if (!senhaCorreta(senha)) {
    redirect("/login?erro=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, tokenSessaoEsperado(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
