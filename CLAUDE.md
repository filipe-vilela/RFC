# Gestão RFC — Contratos, Recebimentos e Agenda

Aplicação web interna da Real Forte Consultoria para gerenciar contratos de
clientes, periodicidade de honorários, recebimentos e agenda de prazos/
atendimento, com uma visão financeira consolidada.

## Stack

- **Next.js 16** (App Router, Turbopack) — frontend e backend no mesmo projeto
- **SQLite** + **Prisma ORM 7** — banco em arquivo único (`dev.db`), fácil de
  migrar para Postgres depois
- **Tailwind CSS 4**
- Sem autenticação por enquanto (uso interno)

## Decisões e pontos de atenção específicos desta stack

- **Prisma 7 exige driver adapter explícito** (não há mais engine binário
  implícito). Usamos `@prisma/adapter-better-sqlite3`. O client é
  instanciado uma única vez em `lib/prisma.ts` (padrão singleton em dev,
  para não esgotar conexões com hot-reload).
- O client gerado do Prisma vai para `app/generated/prisma` (gitignored).
  Rodar `npx prisma generate` sempre que o `schema.prisma` mudar.
- Config do Prisma fica em `prisma7.config.ts` (não em `package.json`).
  O comando de seed está declarado lá em `migrations.seed`.
- `.env` (com `DATABASE_URL="file:./dev.db"`) e `dev.db` **não são
  versionados** (ver `.gitignore`).
- Next.js 16 trouxe breaking changes relevantes de versões anteriores
  (`middleware` → `proxy`, mudanças em `revalidateTag`, etc. — ver
  `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
  Nada disso afeta o escopo atual (sem middleware, sem cache tags), mas
  vale reler antes de usar essas APIs.

## Modelo de dados (`prisma/schema.prisma`)

- **Cliente** — nome, CNPJ, contato, setor, status (ativo/inativo)
- **Contrato** — vinculado a um Cliente; número, escopo, valor,
  periodicidade (mensal/trimestral/único/por fase), data início/fim, status
  (ativo/encerrado/suspenso), `diaAtendimento` (dia fixo de atendimento,
  texto livre, ex. "quinta-feira")
- **Recebimento** — vinculado a um Contrato; valor previsto/realizado, data
  prevista/realizada, status (pendente/pago/atrasado), origem
  (gerado automaticamente vs. lançado manualmente)
- **Compromisso** — vinculado opcionalmente a um Contrato; título,
  descrição, data, tipo (entrega/reunião/prazo interno/atendimento
  recorrente), status

Seed de exemplo em `prisma/seed.ts` (3 clientes, 3 contratos, 3
recebimentos, 3 compromissos) — rodar com `npx prisma db seed`.

## Escopo desta primeira versão

Incluído:
1. CRUD de Cliente, Contrato, Recebimento, Compromisso
2. Geração automática de recebimentos previstos ao salvar um contrato com
   periodicidade (até `dataFim`, ou horizonte padrão de 12 meses se não
   houver `dataFim`); recebimentos gerados podem ser marcados como pagos
   sem recriar a linha
3. Dashboard: recebimentos do mês, contratos ativos, próximos prazos,
   inadimplência
4. Filtros por cliente, status e período nas listagens
5. Calendário de atendimento (mensal/semanal) cruzando `diaAtendimento` dos
   contratos ativos com os compromissos avulsos da Agenda

Fora do escopo (não implementar sem pedido explícito): emissão de nota
fiscal, CRM completo, autenticação/multiusuário.

## Como conduzir o desenvolvimento

- Seguir o roteiro acima **um passo por vez**, sem pular etapas
- Validar cada etapa (rodar `npm run build` e, quando possível, `npm run
  dev` e revisar no browser) antes de avançar para a próxima
- Não gerar código de múltiplas etapas de uma vez
- Manter este arquivo atualizado com novas decisões relevantes

## Status atual

- [x] Passo 1 — projeto Next.js + Tailwind + Prisma, schema definido,
      migração inicial aplicada, seed de teste rodando
- [ ] Passo 2 — páginas de listagem + formulário CRUD por entidade
- [ ] Passo 3 — geração automática de recebimentos previstos
- [ ] Passo 4 — dashboard financeiro
- [ ] Passo 5 — filtros (cliente, status, período)
- [ ] Passo 6 — calendário de atendimento
- [ ] Passo 7 — ajustes visuais e navegação final

## Comandos úteis

```bash
npm run dev              # servidor de desenvolvimento
npm run build             # build de produção (usar para validar cada etapa)
npx prisma migrate dev    # aplicar mudanças de schema
npx prisma generate       # regenerar o client após mudar o schema
npx prisma db seed        # popular o banco com dados de teste
```
