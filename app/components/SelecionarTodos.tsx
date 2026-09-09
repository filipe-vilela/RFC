"use client";

export function SelecionarTodos({ nomeCampo }: { nomeCampo: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Selecionar todos"
      onChange={(event) => {
        const form = event.currentTarget.closest("form");
        form
          ?.querySelectorAll<HTMLInputElement>(`input[name="${nomeCampo}"]`)
          .forEach((checkbox) => {
            checkbox.checked = event.currentTarget.checked;
          });
      }}
    />
  );
}
