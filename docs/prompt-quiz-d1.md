# Prompt de ativação do quiz v3

Configure o quiz do site `bdsharebrasil/conheca-share` no backend existente `bdsharebrasil/backend-share`.

- Leia `docs/quiz-d1.md` e a revisão das sete aeronaves. Use a versão `2026-11-v3` nos dois lados e o mesmo módulo de cálculo. Não confie em `resultado` enviado pelo navegador.
- Preserve o binding `SHARE_DB` do banco `bd_sharebrasil`. Aplique a migração aditiva `migrations/20261114_quiz_participacoes.sql`. Ela cria `quiz_participacoes` e `quiz_eventos`, sem apagar ou recriar `leads_quiz` ou cadastros da operação.
- Configure `QUIZ_HASH_SECRET` como segredo do Worker e mantenha `QUIZ_ALLOWED_ORIGINS` restrito às origens autorizadas do quiz. A rota `/api/quiz/*` resolve seu próprio preflight; não amplie o acesso às rotas internas.
- Nome e telefone são opcionais no começo. Aceite campos vazios e contato parcial. Sem autorização, descarte todos os dados pessoais e registre só a participação sem identificação. Não exija cidade e não bloqueie o resultado por falha de gravação.
- O site já aponta para `https://api.share-brasil.com`. Publique as alterações de backend e frontend de maneira coordenada.
- Teste com dados fictícios: conclusão sem contato; nome sozinho autorizado; telefone sozinho autorizado; todos os sete resultados; sete passageiros e oito ou mais; reenvio sem duplicação; clique separado do WhatsApp; resultado adulterado ignorado pelo servidor; origem externa recusada; nenhuma listagem pública.
- Não invente preços, disponibilidade ou desempenho operacional. As faixas de passageiros e pesos são de triagem comercial e devem ser calibrados com a configuração real da frota.

Entregue confirmação das tabelas e das gravações no D1 real. Não declare a integração ativa antes desse teste. Não exponha valores secretos no relatório.
