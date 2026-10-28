# Gestão RFC — Contratos, Recebimentos e Agenda

Aplicação web interna da Real Forte Consultoria para gerenciar contratos de
clientes, periodicidade de honorários, recebimentos e agenda de prazos/
atendimento, com uma visão financeira consolidada.

## Stack

- **Next.js 16** (App Router, Turbopack) — frontend e backend no mesmo projeto
- **Postgres** + **Prisma ORM 7** — hospedado (Neon/Supabase/Vercel Storage),
  para poder rodar no Vercel e ser acessado pelos sócios (ver "Deploy no
  Vercel"). Rodou em SQLite local até esse ponto; migrado para Postgres
  porque Vercel é serverless e não tem disco persistente entre requisições
  — um arquivo `dev.db` local não sobrevive nesse ambiente.
- **Tailwind CSS 4**
- **Autenticação por senha única compartilhada** (não é multiusuário/CRM —
  ver "Autenticação"), suficiente pra restringir o acesso aos sócios sem
  precisar de cadastro de usuário

## Identidade visual

Paleta e tipografia extraídas de um relatório de referência do usuário
(estudos mercadológicos da Real Forte Consultoria), definidas como tokens
Tailwind em `app/globals.css` (`@theme inline`):

- `brand-navy` `#0D1B4B` / `brand-navy-light` `#1B2E6B` — cor primária
  (títulos, cabeçalho de tabelas, texto do link ativo na navegação)
- `brand-orange` `#E8720C` (hover `brand-orange-dark` `#CC640A`) /
  `brand-orange-light` `#FCEFE2` — cor de destaque (botões primários,
  links, badges de atendimento, sublinhado do link ativo na navegação)
- `brand-grey` `#5B6270` / `brand-grey-light` `#F4F5F7` — texto secundário
  e fundo da página
- `brand-border` `#E4E6EC` / `brand-text` `#22263A`
- Fontes via `next/font/google`: **DM Serif Display** para
  títulos (`h1`-`h4`, regra global em `globals.css`) e **DM Sans** para o
  corpo do texto
- Logo oficial em `public/logo-real-forte.png` (recebido do usuário via
  Google Drive, recortado para remover a margem transparente ao redor da
  arte — o arquivo original tinha bastante espaço em branco acima/abaixo,
  o que deixava a marca pequena demais num header comum). Usado no
  cabeçalho (`app/layout.tsx`, via `next/image`) em `h-14 w-auto`. Como o
  logo já é colorido (navy + laranja) pensado pra fundo claro, o header
  é **branco** com uma borda inferior sutil (`border-brand-border`) — não
  dá pra usar o logo sobre o fundo navy que o header tinha antes, o navy
  do desenho ficaria invisível. `NavLinks.tsx` foi ajustado para essas
  cores claras (texto navy/cinza em vez de branco).
- Cores semânticas (vermelho para erro/inadimplência, verde para
  concluído) foram mantidas fora da paleta da marca de propósito, para não
  se confundirem com o laranja de destaque
- Botões, inputs e links ficam centralizados em `lib/ui.ts` — mudar a
  marca no futuro é editar esse arquivo + `app/globals.css`, não cada
  página

## Decisões e pontos de atenção específicos desta stack

- **Prisma 7 exige driver adapter explícito** (não há mais engine binário
  implícito). Usamos `@prisma/adapter-pg` (Postgres puro via `pg`, funciona
  com qualquer provedor — Neon, Supabase, etc. — que dê uma connection
  string padrão). O client é instanciado uma única vez em `lib/prisma.ts`
  (padrão singleton em dev, para não esgotar conexões com hot-reload).
- O client gerado do Prisma vai para `app/generated/prisma` (gitignored).
  Rodar `npx prisma generate` sempre que o `schema.prisma` mudar.
- Config do Prisma fica em `prisma7.config.ts` (não em `package.json`).
  O comando de seed está declarado lá em `migrations.seed`.
- `.env` (com `DATABASE_URL`, a connection string do Postgres) **não é
  versionado** (ver `.gitignore`). No Vercel isso vira variável de
  ambiente do projeto, não arquivo.
- Next.js 16 trouxe breaking changes relevantes de versões anteriores
  (`middleware` → `proxy`, mudanças em `revalidateTag`, etc. — ver
  `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
  Nada disso afeta o escopo atual (sem middleware, sem cache tags), mas
  vale reler antes de usar essas APIs.
- **Toda página que lê do Prisma diretamente precisa de
  `export const dynamic = "force-dynamic"`.** O App Router só detecta
  dinamismo automaticamente a partir de `cookies()`/`headers()`/
  `searchParams` ou `fetch()`; uma chamada direta ao Prisma não conta, então
  sem essa flag a página é pré-renderizada uma vez no build e fica presa
  aos dados daquele momento (bug real encontrado testando `npm run build &&
  npm run start` — o dashboard e as listagens sem `searchParams` estavam
  sendo servidas como HTML estático). As páginas `[id]/editar` não
  precisam da flag porque o segmento dinâmico já força renderização por
  requisição.

## Modelo de dados (`prisma/schema.prisma`)

- **Cliente** — nome, CNPJ, contato, setor, status (ativo/inativo)
- **Contrato** — vinculado a um Cliente; número, escopo, valor,
  periodicidade (mensal/trimestral/anual/único/por fase/indeterminado),
  data início/fim, status (ativo/encerrado/suspenso), `diaAtendimento`
  (enum `DiaSemana`, selecionado — não é mais texto livre),
  `frequenciaAtendimento` (semanal/quinzenal/mensal), `diaVencimento`
  (dia do mês usado para calcular a data de emissão de NF, ver "Dia de
  vencimento por contrato"), `renovadoAte` (ver "Renovação de contrato"),
  `arquivoContratoUrl`/`arquivoContratoNome` (PDF do contrato assinado,
  opcional — ver "Anexo do contrato assinado em PDF")
- **Desconto** — vinculado a um Contrato; `tipo` (percentual ou valor
  fixo em R$), `percentual`/`valorFixo` (só um dos dois é usado, conforme
  `tipo`), `mesInicio`, `mesFim` (mês corrido desde o início do contrato)
- **Recebimento** — vinculado a um Contrato; valor previsto/realizado, data
  prevista/realizada, `dataEmissaoNF` (preenchida automaticamente a partir
  do Cliente, editável), `emitirNF` (se essa parcela deve gerar NF),
  `valorNF` (opcional, para NF por valor parcial), status (pendente/pago —
  "atrasado" é derivado, ver "Status derivado"), origem
  (gerado automaticamente vs. lançado manualmente)
- **Compromisso** — vinculado opcionalmente a um Contrato; título,
  descrição, data, tipo (entrega/reunião/prazo interno/atendimento
  recorrente), status

Seed de exemplo em `prisma/seed.ts` (3 clientes, 3 contratos — um com
desconto em faixas — e os recebimentos gerados de verdade por
`sincronizarRecebimentosAutomaticos`, não valores fixos) — rodar com
`npx prisma db seed`.

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
   contratos ativos com os compromissos avulsos da Agenda, respeitando a
   `frequenciaAtendimento` (semanal/quinzenal/mensal)
6. Descontos por faixa de meses no contrato; renovação manual do
   horizonte de recebimentos (contratos sem `dataFim`)
7. Ações em lote (marcar como pago / excluir) e relação de notas fiscais
   a emitir por mês, com impressão

Fora do escopo (não implementar sem pedido explícito): emissão de nota
fiscal, CRM completo, contas de usuário individuais (login por sócio,
permissões por papel — a autenticação atual é uma senha única
compartilhada, ver "Autenticação", não multiusuário de verdade).

### Cadastro combinado de cliente novo no formulário de contrato

Em `/contratos/novo`, um alternador ("Cliente existente" / "Cadastrar novo
cliente") troca o `<select>` de cliente por campos de cadastro inline
(`app/contratos/ClienteCampo.tsx`, client component só para esse toggle —
o restante do formulário continua Server Action). Ao salvar, `createContrato`
cria o Cliente e o Contrato na mesma transação. Só existe na criação — o
formulário de edição (`permitirNovoCliente` não passado) continua com o
`<select>` simples, já que trocar de cliente ao editar um contrato
existente é caso raro e não precisa desse atalho.

### Geração automática de recebimentos (`lib/recebimentos.ts`)

- Roda dentro de uma transação, logo após criar/atualizar um contrato
  (`app/contratos/actions.ts`).
- MENSAL/INDETERMINADO: 1 parcela por mês. TRIMESTRAL: a cada 3 meses.
  ANUAL: a cada 12 meses. Todas usam o mesmo horizonte: até `dataFim`, ou
  até `renovadoAte` (ver "Renovação"), ou até `dataInicio` + 12 meses se
  nenhum dos dois estiver definido. UNICO: uma única parcela em
  `dataInicio`. POR_FASE: nenhuma parcela automática — fica a critério de
  lançamento manual, já que fases não têm data previsível.
  INDETERMINADO existe como opção separada de MENSAL só para deixar claro,
  no cadastro, que o contrato não tem cadência formalmente definida — o
  comportamento de geração é idêntico ao mensal.
- A sincronização casa recebimentos existentes com a programação atual
  pela `dataPrevista` exata. Uma parcela com status `PAGO` nunca é alterada
  nem removida, mesmo que a edição do contrato a tire da programação
  (ex.: redução de `dataFim` depois de um pagamento). Parcelas pendentes
  têm o `valorPrevisto` atualizado se o valor do contrato ou os descontos
  mudarem; parcelas que saem da programação e ainda não foram pagas são
  removidas.

### Descontos por período (`Desconto`, `lib/recebimentos.ts`)

- Um contrato pode ter várias faixas de desconto (`tipo`, `mesInicio`,
  `mesFim`), cadastradas em `ContratoForm` via `DescontosCampo.tsx` (client
  component só para adicionar/remover linhas e alternar o tipo antes de
  enviar o form).
- Cada faixa é **percentual OU valor fixo em R$** (`Desconto.tipo`, enum
  `TipoDesconto`) — nunca os dois ao mesmo tempo. `percentual` e
  `valorFixo` são ambos opcionais no schema; qual dos dois vale é decidido
  pelo `tipo`, tanto na leitura do formulário (`readDescontosFormData`,
  `app/contratos/actions.ts`) quanto no cálculo (`aplicarDesconto`,
  `lib/recebimentos.ts` — percentual reduz proporcionalmente, valor fixo
  subtrai um valor absoluto da parcela, nunca deixando o resultado negativo).
  `DescontosCampo.tsx` sempre renderiza os dois campos de valor por linha
  (um escondido via CSS, não `disabled`) para manter os arrays de
  `FormData` alinhados por índice mesmo com tipos diferentes por linha.
- `mesDaParcela` é contado em meses corridos desde `dataInicio`
  independente da periodicidade (ex.: a 2ª parcela trimestral cai no mês
  4) — assim "20% nos 3 primeiros meses, 10% do 4º ao 6º" cobre
  exatamente a 1ª e a 2ª parcela trimestral. Ao editar um contrato os
  descontos são substituídos por completo (delete + recreate), não há
  necessidade de diff já que não são um registro histórico como o
  Recebimento.

### Renovação de contrato (`renovarContrato`, campo `Contrato.renovadoAte`)

- Contratos sem `dataFim` (horizonte rolante de 12 meses) "esgotam" esse
  horizonte com o tempo, já que a geração só roda quando o contrato é
  criado/editado. O botão "Renovar +12m" (listagem de Contratos, só
  aparece quando não há `dataFim`) estende `renovadoAte` por mais 12 meses
  a partir de hoje (ou do fim do horizonte atual, se ainda não tiver
  chegado) e roda a sincronização de novo.

### Status derivado do Recebimento (`lib/recebimento-status.ts`)

- Por pedido do usuário, "atrasado" deixou de ser algo que se escolhe
  manualmente: um recebimento é `PENDENTE` (exibido como "A receber") se
  a `dataPrevista` ainda não chegou, ou `ATRASADO` se já passou — sempre
  calculado na hora, nunca guardado. `ATRASADO` continua no enum do banco
  só por causa dos dados antigos; o formulário de Recebimento não deixa
  mais escolher esse valor.
- `statusEfetivo()` calcula o rótulo pra exibição; `condicaoStatusEfetivo()`
  traduz um filtro da URL (`PENDENTE`/`ATRASADO`/`PAGO`) pra condição
  Prisma equivalente — usado tanto na listagem de Recebimentos quanto no
  dashboard (inadimplência = `PENDENTE` com `dataPrevista` no passado).

### Frequência do atendimento no calendário (`lib/calendario.ts`)

- Além do dia da semana (`Contrato.diaAtendimento`, agora um enum
  `DiaSemana` com `<select>` em vez de texto livre), o contrato tem
  `frequenciaAtendimento` (semanal/quinzenal/mensal), calculada sempre a
  partir da `dataInicio`: quinzenal repete a cada 2 semanas contadas desde
  a semana de `dataInicio`; mensal repete só na mesma "ocorrência do mês"
  (1ª, 2ª, 3ª... semana) em que `dataInicio` cai.

### Dia de vencimento por contrato (`Contrato.diaVencimento`)

- Cadastrado no Contrato (não no Cliente) — ficou no Cliente numa primeira
  versão, mas o usuário percebeu que um mesmo cliente pode ter vários
  contratos com vencimentos de NF diferentes (ex.: Elson's com 2
  contratos, cada um com seu próprio dia) e que manter o campo no Cliente
  tornava impossível diferenciar isso. Migrado de `Cliente.diaVencimento`
  para `Contrato.diaVencimento` (migration
  `20261028131556_mover_dia_vencimento_para_contrato`, com um `UPDATE` de
  backfill que copia o valor do Cliente pra todos os contratos dele antes
  de remover a coluna — preserva o dado existente, que o usuário pode
  depois diferenciar contrato a contrato).
- `montarProgramacaoRecebimentos`/`sincronizarRecebimentosAutomaticos`
  recebem `diaVencimento` como parte do próprio objeto do contrato (não
  mais um parâmetro separado vindo do Cliente) e calculam `dataEmissaoNF`
  de cada parcela usando o mês da própria `dataPrevista` com esse dia
  (ajustado para o último dia do mês quando ele não existir, ex. dia 31
  em fevereiro).
- Campo no formulário de Contrato (`ContratoForm.tsx`), ao lado dos
  descontos — não mais no formulário de Cliente nem no cadastro rápido de
  cliente novo dentro do formulário de Contrato (`ClienteCampo.tsx`, que
  só cuida dos dados do Cliente em si).
- Aparece como coluna "Vencimento NF" na listagem de Contratos
  (`app/contratos/page.tsx`), não mais na de Clientes.

### Ações em lote e impressão de notas fiscais (Recebimentos)

- A listagem de Recebimentos é uma única `<form>` (sem forms aninhados);
  cada linha tem um checkbox `name="ids"`, e os botões de ação usam a prop
  `formAction` do React/Next para chamar Server Actions diferentes dentro
  do mesmo form (inclusive as ações por linha, como "Recebido" e
  "Excluir"). `SelecionarTodos.tsx` e `ConfirmButton.tsx` são os únicos
  client components envolvidos.
- `Recebimento.dataEmissaoNF` é preenchida automaticamente a partir de
  `Contrato.diaVencimento` (dia do mês cadastrado no Contrato — ver
  "Dia de vencimento por contrato"), mas continua editável por parcela
  para exceções. `/recebimentos/notas-fiscais` lista, por mês, os
  recebimentos previstos ordenados por essa data, com um botão de
  impressão (`window.print()` + variante `print:` do Tailwind escondendo
  nav/filtros/botões).
- `Recebimento.emitirNF` (boolean, default `true`) marca se aquela parcela
  deve ou não gerar NF — desmarcado, ela some da relação de notas fiscais
  (`/recebimentos/notas-fiscais` filtra `emitirNF: true`), mas continua
  normalmente na listagem de Recebimentos. `Recebimento.valorNF` é opcional
  e serve para NF por valor parcial (ex.: cliente pede para faturar só
  parte do mês); quando `null`, a relação de notas fiscais usa
  `valorPrevisto` como valor da nota — só quando `valorNF` está preenchido
  e é diferente do previsto que a linha é marcada como "(parcial)" na
  listagem. Os dois campos ficam no formulário de Recebimento ao lado do
  campo de data de emissão da NF.

### Remarcar atendimento arrastando no calendário (`AtendimentoExcecao`)

- Só o atendimento recorrente do contrato é arrastável (o usuário pediu
  especificamente para poder "arrastar o cliente para outra data" quando
  ele solicita reagendamento) — os `Compromisso` avulsos da Agenda não têm
  esse comportamento, continuam somente informativos no calendário.
- A remarcação **não altera** `Contrato.diaAtendimento`/
  `frequenciaAtendimento` — é só uma exceção pontual daquela ocorrência,
  guardada no modelo `AtendimentoExcecao` (`contratoId`, `dataOriginal`,
  `dataNova`, `@@unique([contratoId, dataOriginal])`, cascade delete pelo
  Contrato). `getDadosCalendario` (`lib/calendario.ts`) busca as exceções
  dos contratos ativos visíveis, suprime a ocorrência na `dataOriginal` e
  injeta um item na `dataNova` (só se ela cair dentro do intervalo visível
  da grade) marcado com `movido: true` — exibido com um indicador "↷" e
  contorno laranja.
- Cada item de atendimento carrega sempre a `dataOriginal` (a data em que
  ocorreria pela regra normal do contrato), mesmo quando já está exibido
  numa `dataNova` — é essa chave que identifica a exceção, não a data em
  que o item está sendo mostrado no momento.
- `moverAtendimento(contratoId, dataOriginalISO, dataNovaISO)`
  (`app/calendario/actions.ts`) faz upsert da exceção pela chave composta;
  se `dataNova` for igual à `dataOriginal`, remove a exceção em vez de
  criar (volta a ocorrer na data normal).
- A grade do calendário foi extraída para `app/calendario/CalendarioGrid.tsx`
  (client component) para poder usar drag-and-drop nativo do HTML5
  (`draggable`, `onDragStart`/`onDragOver`/`onDrop`); ao soltar, chama a
  Server Action diretamente (sem `<form>`) e usa `router.refresh()` para
  atualizar a grade. `app/calendario/page.tsx` continua responsável só
  pela busca de dados e pela navegação (mês/semana, anterior/próximo).
- Os itens de `Compromisso` na grade são um `<Link>` pra
  `/agenda/[id]/editar` (mesma página de edição da Agenda, que já serve
  como tela de visualização — não existe uma tela só-leitura separada em
  nenhuma entidade do sistema). Só os compromissos são clicáveis assim;
  os itens de atendimento continuam sendo arrastáveis, não links, já que
  "ver o atendimento" não faz sentido (ele não é um registro próprio, é
  calculado a partir do contrato).

### Autenticação (`lib/auth.ts`, `proxy.ts`, `app/login`)

- Senha única compartilhada entre os sócios — não é login por usuário,
  não tem cadastro, não tem papéis/permissões. Pedido explícito do
  usuário ao decidir colocar o sistema no Vercel (link público) com dados
  sensíveis de clientes/faturamento.
- `proxy.ts` na raiz do projeto (arquivo de proxy do Next 16, substitui o
  antigo `middleware.ts`) intercepta toda requisição exceto `/login` e os
  assets estáticos, e redireciona pra `/login` se o cookie de sessão
  (`rfc_session`) não for válido.
- O "cookie de sessão" não guarda usuário nem expiração server-side: é um
  HMAC-SHA256 fixo (`AUTH_COOKIE_SECRET` + uma string constante), gerado
  em `tokenSessaoEsperado()` (`lib/auth.ts`) e comparado com
  `timingSafeEqual`. Ter o cookie certo prova só que a pessoa digitou a
  senha certa uma vez — suficiente pro caso de uso (sócios, sem troca de
  senha por pessoa). O cookie é `httpOnly` e dura 30 dias
  (`app/login/actions.ts`).
- `senhaCorreta()` compara a senha digitada com `APP_PASSWORD` (variável
  de ambiente), também via `timingSafeEqual`.
- **Variáveis obrigatórias em produção**: `APP_PASSWORD` (a senha que os
  sócios vão digitar) e `AUTH_COOKIE_SECRET` (qualquer string aleatória
  longa, não precisa ser memorizável — só assina o cookie). Trocar os
  dois no Vercel antes de divulgar o link; os valores em `.env` são só
  para desenvolvimento local.

### Anexo do contrato assinado em PDF (`Contrato.arquivoContratoUrl`)

- Upload feito pro **Vercel Blob** (`@vercel/blob`, `put()`/`del()` em
  `app/contratos/actions.ts`), não pro disco do servidor — igual ao
  motivo de termos migrado o banco pra Postgres, o Vercel é serverless e
  não tem disco persistente entre requisições.
- `Contrato.arquivoContratoUrl` (a URL pública do blob) e
  `Contrato.arquivoContratoNome` (nome original do arquivo, só pra
  exibição) são ambos opcionais. `ContratoForm.tsx` mostra um link "Ver
  arquivo atual" quando já existe um, um `<input type="file"
  accept="application/pdf">` pra enviar/substituir, e (só na edição) um
  checkbox "Remover o arquivo atual" pra tirar o anexo sem subir outro.
- Trocar ou remover o anexo apaga o blob antigo do Vercel Blob
  (`removerArquivoAntigo`, melhor esforço — erro de exclusão não derruba
  a ação principal). Excluir o contrato também apaga o blob associado.
- `next.config.ts` tem `experimental.serverActions.bodySizeLimit: "10mb"`
  — o limite padrão do Next (1MB) é pequeno demais pra um PDF de contrato
  assinado digitalizado.
- **Variável obrigatória em produção**: `BLOB_READ_WRITE_TOKEN`. O fluxo
  atual de criar um Blob Store pelo painel do Vercel conecta por OIDC
  (gera só `BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY` automaticamente,
  sem token estático) — isso pode funcionar sozinho em produção, mas pra
  não depender de OIDC Federation estar habilitado no projeto, pegamos o
  token manualmente na aba do Blob Store (".env.local") e adicionamos
  como variável de ambiente à parte. Sem isso, tentar anexar um arquivo
  derruba a Server Action com erro.

### Navegação de mês no Dashboard

- `getDashboardData(mesRef)` (`lib/dashboard.ts`) aceita o mês de
  referência pros três cards que são "do mês" (previsto/recebido/a
  receber) — `app/page.tsx` lê `?mes=M&ano=AAAA` da URL (mês 1-12, ano
  numérico — dois campos separados, não um único `AAAA-MM`).
- A navegação é dois `<select>` (Mês com os 12 nomes fixos em
  `MESES_LABELS`, Ano numa janela de 3 anos antes até 3 anos depois do
  ano atual) dentro de um `<form method="GET">`, no mesmo padrão de
  filtro usado em `FilterBar`. Passou por duas iterações a pedido do
  usuário: primeiro setas "anterior/próximo", depois um único `<select>`
  combinando mês+ano, até chegar nos dois campos separados (mais rápido
  pra pular direto pro mês/ano desejado sem rolar uma lista longa de
  combinações). Link "Hoje" ao lado continua um atalho rápido pro mês
  atual.
- **Inadimplência e Próximos prazos continuam ancorados em hoje**,
  independente do mês navegado — não faz sentido "atrasado" ou "próximo
  compromisso" mudar de significado só porque o usuário foi ver a
  previsão do mês seguinte. Por isso `hoje` em `getDashboardData` é
  sempre `new Date()`, só `inicioMes`/`inicioProximoMes` usam `mesRef`.
- Os dois `<select>` são auto-submit (`SelectAutoSubmit.tsx`, client
  component genérico em `app/components/` — chama `form.requestSubmit()`
  no `onChange`), igual um BI: mudar o mês ou o ano já atualiza a página
  sozinho, sem precisar de um botão "Ver" (removido).

## Diagnóstico de duplicidade no calendário

- Se um cliente aparecer repetido mais vezes que o esperado num mesmo dia
  de atendimento no calendário, a causa mais provável é **múltiplos
  contratos ativos** do mesmo cliente com o mesmo `diaAtendimento` — o
  calendário soma um item por contrato que bate com aquele dia da semana
  (`getDadosCalendario`, `lib/calendario.ts`), isso não é um bug, é a
  soma correta de N contratos reais. Menos provável, mas possível: várias
  linhas de `AtendimentoExcecao` cuja `dataNova` cai no mesmo dia (cada
  uma injeta um item extra), ou duplicidade de verdade na tabela
  `Contrato` (ex.: formulário enviado duas vezes).
- `prisma/diagnostico-calendario.ts` — script avulso (não faz parte do
  app) pra investigar isso: busca um cliente pelo nome (contains,
  case-insensitive) e lista todos os contratos dele (status,
  diaAtendimento, frequência, datas), todas as `AtendimentoExcecao`
  ligadas a esses contratos, e quantos recebimentos cada contrato gerou
  (pra flagrar se a duplicidade também inflou valores previstos, não só
  a exibição no calendário). Roda com
  `npx tsx prisma/diagnostico-calendario.ts "nome do cliente"` — precisa
  de `DATABASE_URL` no ambiente (local já pega do `.env`; contra produção
  é só setar a variável antes, igual se faz pra `migrate deploy`).
- **Caso real já resolvido** (cliente "ELSON'S", outubro/2026): 3
  contratos "012/2026" idênticos (duplicados por reenvio do formulário)
  mais um "012/2026" genuíno em outro dia da semana — cada duplicata
  tinha gerado seu próprio conjunto de recebimentos, inflando o valor
  previsto do cliente em 3x. Resolvido com um script avulso específico
  (apagado depois de usado, não ficou no repo) que excluía os contratos
  duplicados + seus recebimentos numa transação, só depois de confirmar
  que nenhum recebimento envolvido já estava `PAGO`. Pra um caso
  parecido no futuro: usar `diagnostico-calendario.ts` pra confirmar a
  causa, confirmar com o usuário qual registro é o correto antes de
  excluir qualquer coisa, e sempre checar `status !== "PAGO"` antes de
  apagar um recebimento.

## Deploy no Vercel

- O sistema já foi tentado no Vercel antes com SQLite e não funcionou:
  Vercel é serverless, sem disco persistente entre requisições, então um
  arquivo `dev.db` local não sobrevive lá. Por isso a migração para
  Postgres (`@prisma/adapter-pg`) — ver "Stack" e "Decisões e pontos de
  atenção".
- Passo a passo pra colocar no ar:
  1. Criar um banco Postgres gerenciado — pela aba **Storage** do próprio
     painel do Vercel (integra com Neon ou Supabase) ou direto no site da
     Neon/Supabase. Copiar a connection string (`postgresql://...`).
  2. Importar o repositório no Vercel (New Project → selecionar o repo do
     GitHub).
  3. Nas variáveis de ambiente do projeto (Settings → Environment
     Variables), definir `DATABASE_URL` (a connection string do passo 1),
     `APP_PASSWORD` e `AUTH_COOKIE_SECRET` (ver "Autenticação").
  4. Criar um Vercel Blob Store (Storage → Create Database → **Blob**) e
     conectar ao projeto — isso cria sozinho a variável
     `BLOB_READ_WRITE_TOKEN`, necessária pro anexo de PDF do contrato (ver
     "Anexo do contrato assinado em PDF").
  5. Antes do primeiro deploy funcionar de verdade, rodar as migrations
     contra esse banco (`npx prisma migrate deploy`, localmente, com
     `DATABASE_URL` apontando pro banco de produção) — o build do Vercel
     não roda migration automaticamente.
  6. Fazer o deploy (push pro branch conectado, ou "Deploy" no painel).
  7. Compartilhar o link com os sócios + a senha (`APP_PASSWORD`) por um
     canal separado (não no mesmo lugar que o link).
- **`package.json` tem um script `postinstall: "prisma generate"`** — sem
  isso o build do Vercel falha com `Module not found:
  @/app/generated/prisma/client`, porque o cliente gerado do Prisma é
  gitignored (ver "Decisões e pontos de atenção") e o Vercel só roda
  `npm install` + `npm run build`, nunca gera o client sozinho a menos que
  um `postinstall` mande (bug real de uma tentativa de deploy, já
  corrigido — não remover esse script).
- Os sócios não precisam de conta no Vercel nem acesso ao projeto lá —
  só precisam do link e da senha. Acesso ao painel do Vercel (pra ver
  logs, variáveis de ambiente, etc.) é outra permissão, dada convidando o
  e-mail deles em Project Settings → Members, se for o caso.

## Como conduzir o desenvolvimento

- Seguir o roteiro acima **um passo por vez**, sem pular etapas
- Validar cada etapa (rodar `npm run build` e, quando possível, `npm run
  dev` e revisar no browser) antes de avançar para a próxima
- Não gerar código de múltiplas etapas de uma vez
- Manter este arquivo atualizado com novas decisões relevantes

## Status atual

- [x] Passo 1 — projeto Next.js + Tailwind + Prisma, schema definido,
      migração inicial aplicada, seed de teste rodando
- [x] Passo 2 — páginas de listagem + formulário CRUD por entidade
      (Cliente, Contrato, Recebimento, Compromisso); navegação básica em
      `app/layout.tsx`; ações de exclusão bloqueadas com mensagem amigável
      quando há registros filhos (FK constraint); recebimento manual tem
      botão rápido "Marcar como pago"
- [x] Passo 3 — geração automática de recebimentos previstos ao
      criar/editar um contrato (`lib/recebimentos.ts`); contratos "por
      fase" ficam de fora (recebimentos lançados manualmente); recebimentos
      já pagos nunca são alterados ou removidos ao editar o contrato;
      recebimentos pendentes têm o `valorPrevisto` atualizado se o valor do
      contrato mudar
- [x] Passo 4 — dashboard financeiro (`lib/dashboard.ts`, `app/page.tsx`):
      recebido vs. previsto no mês, contratos ativos, inadimplência
      (atrasados + pendentes vencidos) e próximos prazos da agenda; corrigido
      bug em "Marcar como pago" que não preenchia `valorRealizado`
- [x] Passo 5 — filtros por cliente, status e período nas listagens de
      Contratos, Recebimentos e Agenda (`FilterBar`, GET + `searchParams`);
      Clientes tem filtro por status
- [x] Passo 6 — calendário de atendimento (`lib/calendario.ts`,
      `app/calendario`): visão mês/semana, navegação anterior/próximo/hoje;
      cruza `diaAtendimento` dos contratos ativos (parsing tolerante de
      texto livre em `lib/dias-semana.ts`) com os compromissos da Agenda;
      avisa quando um `diaAtendimento` não é reconhecido
- [x] Passo 7 — ajustes visuais e navegação final: identidade visual da
      Real Forte Consultoria aplicada em todo o app (paleta navy/laranja +
      DM Sans/DM Serif Display, ver seção "Identidade visual"); link ativo
      destacado na navegação (`app/components/NavLinks.tsx`, client
      component com `usePathname`); título de aba por página
      (`metadata.title` + template em `app/layout.tsx`); página 404
      personalizada (`app/not-found.tsx`)
- [x] Botão "Marcar como pago" renomeado para "Recebido" (listagem de
      Recebimentos)
- [x] Calendário: arrastar e soltar um atendimento para outra data
      (remarcação avulsa a pedido do cliente), sem alterar o dia/frequência
      do contrato — modelo `AtendimentoExcecao`, Server Action
      `moverAtendimento`, grade extraída para `app/calendario/CalendarioGrid.tsx`
      (client component); ver "Remarcar atendimento arrastando no
      calendário"
- [x] Desconto por valor fixo em R$ (além do percentual já existente) —
      `Desconto.tipo` (enum `TipoDesconto`); Recebimento com flag
      `emitirNF` (emite ou não NF daquela parcela) e `valorNF` opcional
      para NF por valor parcial — ver "Descontos por período" e "Ações em
      lote e impressão de notas fiscais"
- [x] Logo oficial da Real Forte Consultoria no header (`public/logo-real-forte.png`,
      `app/layout.tsx`) — header passou de navy para branco pra dar
      contraste ao logo colorido; `NavLinks.tsx` ajustado pras novas cores
      — ver "Identidade visual"
- [x] Migração de SQLite para Postgres (`@prisma/adapter-pg`) e
      autenticação por senha única compartilhada (`lib/auth.ts`,
      `proxy.ts`, `app/login`), pra poder colocar o sistema no Vercel e
      os sócios acessarem — ver "Deploy no Vercel" e "Autenticação"
- [x] Primeiro deploy real no Vercel (projeto `gestaorfc`, banco Neon) —
      corrigido `postinstall` faltando (client do Prisma não gerado no
      build) e lockfile desatualizado
- [x] Anexo de PDF do contrato assinado (Vercel Blob,
      `Contrato.arquivoContratoUrl`) e compromissos clicáveis no
      calendário (`<Link>` pra `/agenda/[id]/editar`) — ver "Anexo do
      contrato assinado em PDF" e "Remarcar atendimento arrastando no
      calendário"
- [x] Navegação de mês no Dashboard — dois `<select>` (Mês/Ano)
      auto-submit, estilo BI — ver "Navegação de mês no Dashboard"
- [x] Script de diagnóstico pra duplicidade de atendimento no calendário
      (`prisma/diagnostico-calendario.ts`) — ver "Diagnóstico de
      duplicidade no calendário"
- [x] Dia de vencimento da NF movido do Cliente para o Contrato (um
      cliente pode ter contratos com vencimentos diferentes) — ver
      "Dia de vencimento por contrato"

## Comandos úteis

```bash
npm run dev               # servidor de desenvolvimento
npm run build             # build de produção (usar para validar cada etapa)
npx prisma migrate dev    # aplicar mudanças de schema (local)
npx prisma migrate deploy # aplicar migrations pendentes em produção (Vercel)
npx prisma generate       # regenerar o client após mudar o schema
npx prisma db seed        # popular o banco com dados de teste
```
