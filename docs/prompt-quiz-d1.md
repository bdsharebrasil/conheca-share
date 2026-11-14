# Prompt para configurar as tabelas e a integração D1

Use o texto abaixo no ambiente de desenvolvimento que tem acesso ao seu Cloudflare D1. A implementação já está neste repositório; o objetivo é ativá-la e validar o ambiente real.

---

Configure a captura de leads do quiz “Descubra sua aeronave” do repositório `bdsharebrasil/conheca-share`, usando exclusivamente Cloudflare Workers + D1 para esses registros.

Leia primeiro `docs/quiz-d1.md`, `cloudflare/quiz/worker.js`, `cloudflare/quiz/wrangler.example.jsonc` e `cloudflare/quiz/migrations/0001_leads_quiz.sql`. Preserve o site e os cadastros existentes.

1. Identifique o banco D1 correto. Crie uma configuração a partir do exemplo, usando binding `DB` e o nome/ID reais. Se o banco já possui histórico de migrações de outro projeto, configure `migrations_table` exclusivo para o quiz.
2. Revise e aplique o SQL existente, sem recriar tabelas operacionais. Ele deve criar `leads_quiz`, `eventos_quiz` e `limites_quiz`, seus índices, checks e FK de eventos com exclusão em cascata. Não substitua esse esquema por outro incompatível com os INSERTs do Worker.
3. Os leads devem guardar nome, WhatsApp normalizado com DDI, cidade, rotas opcionais, momento de compra, respostas JSON, resultado JSON calculado no servidor, sugestão e alternativa, versão do quiz, origem UTM, duração, consentimento com data/versão e status comercial UPPERCASE. O clique WhatsApp deve ter data própria e não equivale a mensagem enviada.
4. Defina `QUIZ_HASH_SECRET` no gerenciador de segredos da Cloudflare. Não exponha credenciais na interface nem no Git. Configure apenas as origens reais em `ORIGENS_PERMITIDAS`.
5. Publique o Worker e configure `VITE_QUIZ_API_URL` no ambiente do site. Recompile o front-end. Alternativamente, roteie `/api/quiz/*` no mesmo domínio para esse Worker.
6. Preserve validação, pontuação no servidor, SQL parametrizado, limite de corpo/frequência, token de evento, reenvio sem duplicação e ausência de rotas públicas de listagem. O site deve salvar o contato imediatamente no envio do formulário final, mesmo que o visitante não abra o WhatsApp. Só mostre “perfil registrado” após confirmação da API.
7. Preserve a rotina diária de limpeza apenas dos contadores técnicos vencidos. Não programe exclusão automática de contatos sem um prazo definido pela Share. Mantenha o aviso de uso dos dados e o canal de acesso, correção e exclusão. Não ative integração automática de marketing ou mensagens externas além do contato autorizado pelo visitante.
8. Valide num D1 de homologação: lead salvo sem WhatsApp; duplo envio sem duplicação; clique registrado; respostas inválidas recusadas; falha de rede com aviso e tentativa posterior. Confirme que não há dados pessoais em logs ou armazenamento persistente do navegador.
9. Não invente preços de cotas, disponibilidade ou percentuais de compatibilidade. Os pesos e faixas de passageiros são uma triagem comercial que a Share deve calibrar com a configuração real de cada aeronave. Perfis que extrapolam as opções devem ir para análise humana.

Entregue a URL real da API, as variáveis de ambiente configuradas sem valores secretos, as tabelas efetivamente criadas e a evidência do teste de gravação antes do clique no WhatsApp. Informe qualquer dependência que não foi configurada; não declare a captura ativa enquanto não houver confirmação no D1 real.
