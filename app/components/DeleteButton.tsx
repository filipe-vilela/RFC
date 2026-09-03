"use client";

import { buttonDangerClass } from "@/lib/ui";

export function DeleteButton({ confirmMessage }: { confirmMessage: string }) {
  return (
    <button
      type="submit"
      className={buttonDangerClass}
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      Excluir
    </button>
  );
}
