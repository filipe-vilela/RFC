import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "rfc_session";

/**
 * Token de sessão fixo, derivado do segredo do servidor — não guarda usuário
 * nenhum, só prova que quem tem o cookie já digitou a senha certa uma vez.
 * Suficiente para um sistema interno de uso compartilhado, sem cadastro de
 * usuários.
 */
export function tokenSessaoEsperado(): string {
  return createHmac("sha256", requireEnv("AUTH_COOKIE_SECRET")).update("rfc-auth").digest("hex");
}

export function tokenSessaoValido(token: string | undefined): boolean {
  if (!token) return false;
  const esperado = tokenSessaoEsperado();
  const bufA = Buffer.from(token);
  const bufB = Buffer.from(esperado);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function senhaCorreta(senha: string): boolean {
  const esperada = requireEnv("APP_PASSWORD");
  const bufA = Buffer.from(senha);
  const bufB = Buffer.from(esperada);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function requireEnv(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não definida.`);
  }
  return valor;
}
