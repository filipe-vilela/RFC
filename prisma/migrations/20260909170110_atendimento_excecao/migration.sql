-- CreateTable
CREATE TABLE "AtendimentoExcecao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "dataOriginal" DATETIME NOT NULL,
    "dataNova" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AtendimentoExcecao_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AtendimentoExcecao_contratoId_dataOriginal_key" ON "AtendimentoExcecao"("contratoId", "dataOriginal");
