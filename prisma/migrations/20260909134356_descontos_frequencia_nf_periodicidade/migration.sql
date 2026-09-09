-- AlterTable
ALTER TABLE "Recebimento" ADD COLUMN "dataEmissaoNF" DATETIME;

-- CreateTable
CREATE TABLE "Desconto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "percentual" REAL NOT NULL,
    "mesInicio" INTEGER NOT NULL,
    "mesFim" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Desconto_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "escopo" TEXT,
    "valor" REAL NOT NULL,
    "periodicidade" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "diaAtendimento" TEXT,
    "frequenciaAtendimento" TEXT NOT NULL DEFAULT 'SEMANAL',
    "renovadoAte" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contrato" ("clienteId", "createdAt", "dataFim", "dataInicio", "diaAtendimento", "escopo", "id", "numero", "periodicidade", "status", "updatedAt", "valor") SELECT "clienteId", "createdAt", "dataFim", "dataInicio", "diaAtendimento", "escopo", "id", "numero", "periodicidade", "status", "updatedAt", "valor" FROM "Contrato";
DROP TABLE "Contrato";
ALTER TABLE "new_Contrato" RENAME TO "Contrato";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- DataFixup: diaAtendimento era texto livre (ex. "quinta-feira") e passou a
-- ser um enum (DOMINGO..SABADO). Normaliza os valores já cadastrados antes
-- da mudança de tipo para não perder o dado; qualquer texto não reconhecido
-- vira NULL em vez de ficar com um valor inválido para o enum.
UPDATE "Contrato" SET "diaAtendimento" = 'DOMINGO' WHERE "diaAtendimento" IS NOT NULL AND LOWER("diaAtendimento") LIKE '%domingo%';
UPDATE "Contrato" SET "diaAtendimento" = 'SEGUNDA' WHERE "diaAtendimento" IS NOT NULL AND LOWER("diaAtendimento") LIKE '%segunda%';
UPDATE "Contrato" SET "diaAtendimento" = 'TERCA' WHERE "diaAtendimento" IS NOT NULL AND (LOWER("diaAtendimento") LIKE '%terça%' OR LOWER("diaAtendimento") LIKE '%terca%');
UPDATE "Contrato" SET "diaAtendimento" = 'QUARTA' WHERE "diaAtendimento" IS NOT NULL AND LOWER("diaAtendimento") LIKE '%quarta%';
UPDATE "Contrato" SET "diaAtendimento" = 'QUINTA' WHERE "diaAtendimento" IS NOT NULL AND LOWER("diaAtendimento") LIKE '%quinta%';
UPDATE "Contrato" SET "diaAtendimento" = 'SEXTA' WHERE "diaAtendimento" IS NOT NULL AND LOWER("diaAtendimento") LIKE '%sexta%';
UPDATE "Contrato" SET "diaAtendimento" = 'SABADO' WHERE "diaAtendimento" IS NOT NULL AND (LOWER("diaAtendimento") LIKE '%sábado%' OR LOWER("diaAtendimento") LIKE '%sabado%');
UPDATE "Contrato" SET "diaAtendimento" = NULL WHERE "diaAtendimento" IS NOT NULL AND "diaAtendimento" NOT IN ('DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO');
