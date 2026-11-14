# Quiz «Descubra sua aeronave» — configuração e operação

O quiz usa o site atual (TanStack + JavaScript público) e uma API Cloudflare Worker separada. Não é necessário migrar o site para outro serviço. Nenhum banco foi criado ou alterado automaticamente por esta implementação.

## O que está pronto

- Jornada em português, oito perguntas, voltar/revisar e refazer.
- Sete perfis: Cirrus SR20, Seneca V, Piper Matrix, Cheyenne II, Citation II, Meridian / M500 e Hawker Beechcraft 400A.
- Resultado com os motivos vinculados às respostas, alternativa e pontos para a conversa.
- Formulário final com nome, WhatsApp com DDD e cidade obrigatórios; rotas opcionais e momento de compra.
- Registro no banco ao enviar o formulário, **antes e independentemente do WhatsApp**.
- Mensagem WhatsApp com contato, perfil, sugestão, alternativa e referência do lead.
- Evento `WHATSAPP_CLICADO` independente; clique não comprova envio ou recebimento da mensagem.
- Consentimento explícito, parâmetros UTM limitados, dados pessoais só na memória do navegador durante a jornada. Não usa localStorage para contatos.
- Validação no servidor, cálculo compartilhado, SQL com parâmetros, reenvio sem duplicação, proteção de origem, limite de 60 requisições por IP/hora e campo antispam.

Só é possível identificar quem fornece o contato. Quem abandona as perguntas antes do formulário não gera um lead identificado. Em caso de falha de rede, o resultado continua acessível com aviso claro de que **não foi salvo** e botão para tentar novamente; o WhatsApp permanece disponível com o perfil preenchido.

## 1. Preparar o Worker e vincular seu D1

Na raiz deste repositório:

```sh
cp cloudflare/quiz/wrangler.example.jsonc cloudflare/quiz/wrangler.jsonc
```

Preencha no arquivo copiado:

- `database_name`: nome do seu banco existente.
- `database_id`: ID do banco no painel da Cloudflare.
- `ORIGENS_PERMITIDAS`: origens exatas do site, separadas por vírgula, sem barra final. Inclua domínio com `www` apenas se utilizado. Nunca use `*`.

O binding deve se chamar `DB`. Não coloque token da conta Cloudflare no código ou no front-end.

Se usar um banco compartilhado com outros projetos, mantenha o histórico de migrações deste Worker separado adicionando `"migrations_table": "d1_migrations_quiz"` ao seu binding. O SQL só cria tabelas com nomes próprios; não recria tabelas existentes.

## 2. Criar as tabelas

O SQL exato está em `cloudflare/quiz/migrations/0001_leads_quiz.sql`.

Teste primeiro localmente:

```sh
npx wrangler d1 migrations apply NOME_DO_SEU_BANCO --local --config cloudflare/quiz/wrangler.jsonc
```

Para aplicar no banco real, depois de revisar o destino:

```sh
npx wrangler d1 migrations apply NOME_DO_SEU_BANCO --remote --config cloudflare/quiz/wrangler.jsonc
```

Também pode executar o conteúdo do SQL no console D1. Escolha um método de aplicação; se executar pelo console, não tente reaplicar por outra ferramenta sem alinhar seu histórico.

| Tabela | Finalidade |
| --- | --- |
| `leads_quiz` | Contato, respostas, recomendação, origem, autorização e acompanhamento comercial |
| `eventos_quiz` | Registro de perfil salvo e clique no WhatsApp, sem duplicar eventos |
| `limites_quiz` | Contadores temporários para limitar envios abusivos; não armazena IP bruto |

## 3. Configurar segredo e publicar a API

Crie um segredo aleatório de pelo menos 32 caracteres e informe-o quando o comando solicitar. Ele assina os tokens de eventos e os identificadores dos contadores. Mantenha-o estável; a rotação invalida tokens de cliques já emitidos, sem apagar leads.

```sh
npx wrangler secret put QUIZ_HASH_SECRET --config cloudflare/quiz/wrangler.jsonc
npx wrangler deploy --config cloudflare/quiz/wrangler.jsonc
```

A API não tem rota pública de listagem, edição ou exclusão de leads. Consulte-os pelo console D1 ou por um painel interno autenticado já existente. O filtro de origem é uma camada de proteção do navegador; ele não substitui o limite de frequência contra clientes que simulam cabeçalhos. Se houver abuso, habilite também as proteções disponíveis no seu domínio Cloudflare.

O Cron remove diariamente somente contadores técnicos vencidos. Contatos e eventos comerciais não são apagados automaticamente. A Share pode definir sua política de retenção e exclusão administrativa conforme a continuidade do atendimento; a autorização de registro e contato permanece no formulário final do quiz.

## 4. Conectar o site

No ambiente de build do site/Lovable, configure:

```text
VITE_QUIZ_API_URL=https://URL_REAL_DO_WORKER
```

Use só a origem, sem `/api/quiz/leads`. Faça um novo build/publicação do site para incorporar a variável.

Se preferir uma rota no próprio domínio, direcione `/api/quiz/*` para o Worker no Cloudflare e deixe a variável vazia. Esse é o comportamento padrão, mas requer o roteamento configurado; o site sozinho não fornece essa API.

O telefone comercial está centralizado em `public/quiz-model.js` e usa o número já presente no site: `5565981730641`.

## 5. Validar a integração real

1. Inclua sua origem de homologação em `ORIGENS_PERMITIDAS` e use um D1 de teste.
2. Responda às perguntas e envie um contato fictício autorizado para teste.
3. Sem clicar no WhatsApp, confirme que existe um lead e um evento `PERFIL_SALVO`.
4. Abra o WhatsApp: confirme o perfil na mensagem e o evento `WHATSAPP_CLICADO`. Não é preciso enviar a mensagem para testar o link.
5. Simule uma queda de conexão. O site deve informar que não salvou; restaurar a conexão e tentar de novo deve manter apenas um registro.
6. Verifique também o fluxo de grupo de sete ou mais passageiros: encaminha para análise personalizada.

Teste local completo: adicione `http://localhost:4173` às origens de desenvolvimento, use `.dev.vars` ao lado do arquivo Wrangler com um segredo **só local**, rode `wrangler dev` com a configuração e configure `VITE_QUIZ_API_URL` para a origem que o Wrangler informar. Não publique `.dev.vars`.

## Consultas úteis no console D1

Novos contatos, inclusive os que não abriram WhatsApp:

```sql
SELECT protocolo, nome, telefone, cidade, aeronave_sugerida, momento,
       status, criado_em, whatsapp_clicado_em
FROM leads_quiz
ORDER BY criado_em DESC;
```

Contatos que ainda não clicaram no WhatsApp:

```sql
SELECT protocolo, nome, telefone, cidade, aeronave_sugerida, criado_em
FROM leads_quiz
WHERE whatsapp_clicado_em IS NULL
ORDER BY criado_em DESC;
```

Resumo por perfil, sem percentual de compatibilidade inventado:

```sql
SELECT COALESCE(aeronave_sugerida, 'ANALISE_PERSONALIZADA') AS perfil,
       COUNT(*) AS total_leads,
       SUM(CASE WHEN whatsapp_clicado_em IS NOT NULL THEN 1 ELSE 0 END) AS abriram_whatsapp
FROM leads_quiz
GROUP BY aeronave_sugerida
ORDER BY total_leads DESC;
```

Detalhar respostas de um lead (use a referência real no lugar de `SH-REFERENCIA`):

```sql
SELECT l.protocolo, j.key AS pergunta, j.value AS resposta
FROM leads_quiz AS l, json_each(l.respostas_json) AS j
WHERE l.protocolo = 'SH-REFERENCIA';
```

Atualizar acompanhamento:

```sql
UPDATE leads_quiz
SET status = 'EM_CONTATO', atualizado_em = CURRENT_TIMESTAMP
WHERE protocolo = 'SH-REFERENCIA';
```

Para uma solicitação de exclusão confirmada pela equipe, faça a exclusão administrativa do lead no banco por `id`; a FK com `ON DELETE CASCADE` remove os eventos vinculados. Não ofereça exclusão pública só por telefone ou protocolo.

## Calibrar os perfis antes de uma campanha

Os pesos e `limitePerfil` em `public/quiz-model.js` são parâmetros de **triagem comercial**, não a lotação certificada ou promessa de desempenho da frota. As faixas conservadoras são definidas em `public/quiz-model.js` para os sete perfis e devem ser calibradas pela Share conforme configuração, tripulação e operação reais. A opção «7 ou mais» vai para análise humana por ser uma faixa aberta. A Share deve ajustar as faixas conforme configuração, tripulação e operação reais.

O jato fica fora quando o cliente declara precisar de pistas não pavimentadas, inclusive na opção mista. Isso evita apresentar uma solução que não cobre parte da missão. Os demais modelos também dependem de estudo de pistas; nenhuma resposta confirma viabilidade operacional. Distância, horas e preferências somam pontos, mas não substituem performance, peso e balanceamento nem análise comercial.

Mude as regras apenas no módulo compartilhado e atualize `VERSAO_QUIZ` em qualquer alteração que mude perguntas, valores ou resultado. Publique site e Worker juntos. O servidor rejeita versões antigas em vez de registrar um perfil diferente do que o visitante respondeu.

## Validação disponível no repositório

`npm test` cobre as 23.040 combinações de respostas, os sete perfis, restrições de passageiros/pistas, mensagem WhatsApp e o Worker com SQL real em SQLite. Os testes de banco executam as consultas e constraints com um adaptador local; não substituem a validação do binding num D1 real.

`npm run build` gera o site. `node --check cloudflare/quiz/worker.js` verifica sintaxe do Worker. Os arquivos públicos do quiz são copiados como recursos estáticos; a rota monta e desmonta seus listeners por eventos, inclusive quando o módulo já está em cache.

Referências oficiais: [D1 bindings e batch](https://developers.cloudflare.com/d1/worker-api/d1-database/) e [migrações D1](https://developers.cloudflare.com/d1/reference/migrations/).

## Imagens das aeronaves

O resultado do quiz carrega a imagem do perfil escolhido no bucket R2 `avatar-aeronaves`, no prefixo `quiz/`, usando a base pública `https://pub-f4fb8ab5edc0402a840f54b4988012c2.r2.dev/quiz`. A base está centralizada em `AERONAVES_IMAGENS_BASE_URL` no modelo compartilhado; cada perfil aponta para o arquivo correspondente (`400A.png`, `CHEYENNEII-PA-31T.jpeg`, `PA-46-500TP.jpg`, `PA-46R-350T.png`, `SENECA-V-PA-34-220T.jpg`, `SR20.png` ou `c550.jpg`).
