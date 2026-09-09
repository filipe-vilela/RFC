"use client";

import { buttonPrimaryClass } from "@/lib/ui";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonPrimaryClass + " print:hidden"}
    >
      Imprimir
    </button>
  );
}
