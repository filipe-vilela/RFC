-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Desconto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PERCENTUAL',
    "percentual" REAL,
    "valorFixo" REAL,
    "mesInicio" INTEGER NOT NULL,
    "mesFim" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Desconto_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Desconto" ("contratoId", "createdAt", "id", "mesFim", "mesInicio", "percentual") SELECT "contratoId", "createdAt", "id", "mesFim", "mesInicio", "percentual" FROM "Desconto";
DROP TABLE "Desconto";
ALTER TABLE "new_Desconto" RENAME TO "Desconto";
CREATE TABLE "new_Recebimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "valorPrevisto" REAL NOT NULL,
    "valorRealizado" REAL,
    "dataPrevista" DATETIME NOT NULL,
    "dataRealizada" DATETIME,
    "dataEmissaoNF" DATETIME,
    "emitirNF" BOOLEAN NOT NULL DEFAULT true,
    "valorNF" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "origem" TEXT NOT NULL DEFAULT 'GERADO_AUTOMATICAMENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recebimento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Recebimento" ("contratoId", "createdAt", "dataEmissaoNF", "dataPrevista", "dataRealizada", "id", "origem", "status", "updatedAt", "valorPrevisto", "valorRealizado") SELECT "contratoId", "createdAt", "dataEmissaoNF", "dataPrevista", "dataRealizada", "id", "origem", "status", "updatedAt", "valorPrevisto", "valorRealizado" FROM "Recebimento";
DROP TABLE "Recebimento";
ALTER TABLE "new_Recebimento" RENAME TO "Recebimento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
