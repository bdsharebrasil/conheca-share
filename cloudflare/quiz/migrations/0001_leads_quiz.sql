-- Novas tabelas isoladas: não altera nenhum cadastro financeiro ou operacional.
CREATE TABLE IF NOT EXISTS leads_quiz (
  id TEXT PRIMARY KEY NOT NULL,
  protocolo TEXT NOT NULL UNIQUE,
  chave_reenvio TEXT NOT NULL UNIQUE,
  resumo_envio TEXT NOT NULL,
  nome TEXT NOT NULL CHECK(length(nome) BETWEEN 2 AND 100),
  telefone TEXT NOT NULL,
  cidade TEXT NOT NULL,
  rotas TEXT,
  momento TEXT NOT NULL CHECK(momento IN ('EXPLORANDO','ATE_3_MESES','ATE_6_MESES','ESTE_ANO')),
  respostas_json TEXT NOT NULL CHECK(json_valid(respostas_json)),
  resultado_json TEXT NOT NULL CHECK(json_valid(resultado_json)),
  aeronave_sugerida TEXT CHECK(aeronave_sugerida IN ('cirrus','matrix','seneca','cheyenne','citation')),
  aeronave_alternativa TEXT CHECK(aeronave_alternativa IN ('cirrus','matrix','seneca','cheyenne','citation')),
  versao_quiz TEXT NOT NULL,
  origem_json TEXT NOT NULL CHECK(json_valid(origem_json)),
  duracao_segundos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NOVO' CHECK(status IN ('NOVO','EM_CONTATO','QUALIFICADO','CONVERTIDO','SEM_INTERESSE')),
  consentimento INTEGER NOT NULL CHECK(consentimento=1),
  versao_consentimento TEXT NOT NULL,
  consentimento_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  token_evento_hash TEXT NOT NULL,
  whatsapp_clicado_em TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leads_quiz_criado ON leads_quiz(criado_em);
CREATE INDEX IF NOT EXISTS idx_leads_quiz_status ON leads_quiz(status,criado_em);
CREATE INDEX IF NOT EXISTS idx_leads_quiz_aeronave ON leads_quiz(aeronave_sugerida,criado_em);
CREATE INDEX IF NOT EXISTS idx_leads_quiz_telefone ON leads_quiz(telefone);

CREATE TABLE IF NOT EXISTS eventos_quiz (
  id TEXT PRIMARY KEY NOT NULL,
  lead_id TEXT NOT NULL REFERENCES leads_quiz(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK(tipo IN ('PERFIL_SALVO','WHATSAPP_CLICADO')),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lead_id,tipo)
);
CREATE INDEX IF NOT EXISTS idx_eventos_quiz_lead ON eventos_quiz(lead_id);

-- Contador temporário com hash do endereço; nenhum IP bruto é persistido.
CREATE TABLE IF NOT EXISTS limites_quiz (
  chave TEXT PRIMARY KEY NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  expira_em INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_limites_quiz_expira ON limites_quiz(expira_em);
