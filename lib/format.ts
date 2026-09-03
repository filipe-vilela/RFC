export function formatMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatDataInput(data: Date): string {
  return data.toISOString().slice(0, 10);
}
