-- O dia de vencimento da NF passa a ser cadastrado por Contrato, não por
-- Cliente (um mesmo cliente pode ter contratos com vencimentos diferentes).

-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN "diaVencimento" INTEGER;

-- Backfill: cada contrato existente herda o valor que estava no Cliente,
-- preservando o comportamento atual até o usuário ajustar por contrato.
UPDATE "Contrato" c
SET "diaVencimento" = cl."diaVencimento"
FROM "Cliente" cl
WHERE c."clienteId" = cl."id";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "diaVencimento";
