-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('MENSAL', 'TRIMESTRAL', 'ANUAL', 'UNICO', 'POR_FASE', 'INDETERMINADO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'ENCERRADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "StatusRecebimento" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "OrigemRecebimento" AS ENUM ('GERADO_AUTOMATICAMENTE', 'LANCADO_MANUALMENTE');

-- CreateEnum
CREATE TYPE "TipoCompromisso" AS ENUM ('ENTREGA', 'REUNIAO', 'PRAZO_INTERNO', 'ATENDIMENTO_RECORRENTE');

-- CreateEnum
CREATE TYPE "StatusCompromisso" AS ENUM ('PENDENTE', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO');

-- CreateEnum
CREATE TYPE "FrequenciaAtendimento" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "TipoDesconto" AS ENUM ('PERCENTUAL', 'VALOR_FIXO');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "contatoNome" TEXT,
    "contatoEmail" TEXT,
    "contatoTelefone" TEXT,
    "setor" TEXT,
    "diaVencimento" INTEGER,
    "status" "StatusCliente" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "escopo" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "diaAtendimento" "DiaSemana",
    "frequenciaAtendimento" "FrequenciaAtendimento" NOT NULL DEFAULT 'SEMANAL',
    "renovadoAte" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Desconto" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tipo" "TipoDesconto" NOT NULL DEFAULT 'PERCENTUAL',
    "percentual" DOUBLE PRECISION,
    "valorFixo" DOUBLE PRECISION,
    "mesInicio" INTEGER NOT NULL,
    "mesFim" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Desconto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtendimentoExcecao" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "dataOriginal" TIMESTAMP(3) NOT NULL,
    "dataNova" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtendimentoExcecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recebimento" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "valorPrevisto" DOUBLE PRECISION NOT NULL,
    "valorRealizado" DOUBLE PRECISION,
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "dataRealizada" TIMESTAMP(3),
    "dataEmissaoNF" TIMESTAMP(3),
    "emitirNF" BOOLEAN NOT NULL DEFAULT true,
    "valorNF" DOUBLE PRECISION,
    "status" "StatusRecebimento" NOT NULL DEFAULT 'PENDENTE',
    "origem" "OrigemRecebimento" NOT NULL DEFAULT 'GERADO_AUTOMATICAMENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recebimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compromisso" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoCompromisso" NOT NULL,
    "status" "StatusCompromisso" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compromisso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AtendimentoExcecao_contratoId_dataOriginal_key" ON "AtendimentoExcecao"("contratoId", "dataOriginal");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desconto" ADD CONSTRAINT "Desconto_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendimentoExcecao" ADD CONSTRAINT "AtendimentoExcecao_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recebimento" ADD CONSTRAINT "Recebimento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
