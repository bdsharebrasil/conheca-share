// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error Shared Worker implementation is JavaScript.
import worker from "../../cloudflare/quiz/worker.js";
// @ts-expect-error Shared commercial model is JavaScript.
import { VERSAO_QUIZ, recomendar } from "../../public/quiz-model.js";

// Executes the real SQL, placeholders, constraints and transactions on SQLite.
class Banco {
  sqlite = new DatabaseSync(":memory:");
  constructor() {
    this.sqlite.exec("PRAGMA foreign_keys=ON");
    this.sqlite.exec(readFileSync("cloudflare/quiz/migrations/0001_leads_quiz.sql", "utf8"));
  }
  prepare(sql: string) {
    const db = this.sqlite;
    const criar = (args: any[] = []) => ({
      sql,
      args,
      bind: (...values: any[]) => criar(values),
      first: async () => db.prepare(sql).get(...args) || null,
      run: async () => db.prepare(sql).run(...args),
    });
    return criar();
  }
  async batch(statements: any[]) {
    this.sqlite.exec("BEGIN");
    try {
      const result = [];
      for (const s of statements) result.push(await s.run());
      this.sqlite.exec("COMMIT");
      return result;
    } catch (e) {
      this.sqlite.exec("ROLLBACK");
      throw e;
    }
  }
}
const respostas = {
  uso: "familia",
  pax: "1-2",
  distancia: "regional",
  horas: "ate-3",
  pista: "asfalto",
  prioridade: "custo",
  conforto: "indiferente",
  seguranca: "caps",
};
const envio = () => ({
  chave_reenvio: crypto.randomUUID(),
  versao: VERSAO_QUIZ,
  respostas,
  contato: {
    nome: "Cliente Teste",
    telefone: "(65) 99999-1234",
    cidade: "Cuiabá",
    rotas: "Cuiabá / fazenda",
    momento: "ATE_3_MESES",
    consentimento: true,
  },
  origem: { utm_source: "teste", ignorar: "não salvar" },
  duracao_segundos: 100,
});
const origin = "https://conheca.share-brasil.com";
let env: any;
function request(body: any, options: { path?: string; origin?: string; method?: string } = {}) {
  return worker.fetch(
    new Request(`https://api.example.com${options.path || "/api/quiz/leads"}`, {
      method: options.method || "POST",
      headers: {
        Origin: options.origin || origin,
        "Content-Type": "application/json",
        "CF-Connecting-IP": "192.0.2.1",
      },
      ...(options.method === "GET" ? {} : { body: JSON.stringify(body) }),
    }),
    env,
  );
}
beforeEach(() => {
  env = {
    DB: new Banco(),
    QUIZ_HASH_SECRET: "local-test-only-secret-not-for-production",
    ORIGENS_PERMITIDAS: origin,
  };
});
describe("Captura D1 do quiz", () => {
  it("salva lead e evento antes de qualquer WhatsApp, normaliza contato e calcula no servidor", async () => {
    const body = { ...envio(), resultado: { principal: "citation" } };
    const res = await request(body);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.resultado).toEqual(recomendar(respostas));
    const row = env.DB.sqlite.prepare("SELECT * FROM leads_quiz").get();
    expect(row.telefone).toBe("5565999991234");
    expect(row.status).toBe("NOVO");
    expect(row.whatsapp_clicado_em).toBeNull();
    expect(JSON.parse(row.origem_json)).toEqual({ utm_source: "teste" });
    expect(row.token_evento_hash).not.toBe(data.token_evento);
    expect(env.DB.sqlite.prepare("SELECT tipo FROM eventos_quiz").get().tipo).toBe("PERFIL_SALVO");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
  it("reenvios e cliques repetidos não duplicam lead nem evento", async () => {
    const body = envio();
    const a = await (await request(body)).json(),
      b = await (await request(body)).json();
    expect(a).toEqual(b);
    const evento = { tipo: "WHATSAPP_CLICADO", token: a.token_evento };
    const path = `/api/quiz/leads/${a.id}/eventos`;
    expect((await request(evento, { path })).status).toBe(200);
    await request(evento, { path });
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM leads_quiz").get().n).toBe(1);
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM eventos_quiz").get().n).toBe(2);
    expect(
      env.DB.sqlite.prepare("SELECT whatsapp_clicado_em FROM leads_quiz").get().whatsapp_clicado_em,
    ).toBeTruthy();
  });
  it("rejeita alteração de um envio existente", async () => {
    const body = envio();
    await request(body);
    body.contato.nome = "Outro Nome";
    expect((await request(body)).status).toBe(409);
    expect(env.DB.sqlite.prepare("SELECT nome FROM leads_quiz").get().nome).toBe("Cliente Teste");
  });
  it("não grava sem consentimento, com respostas adulteradas ou armadilha preenchida", async () => {
    for (const body of [
      { ...envio(), contato: { ...envio().contato, consentimento: false } },
      { ...envio(), respostas: { ...respostas, pax: "999" } },
      { ...envio(), website: "spam" },
    ])
      expect((await request(body)).status).toBe(400);
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM leads_quiz").get().n).toBe(0);
  });
  it("valida origem e token, e não disponibiliza listagem pública", async () => {
    expect((await request(envio(), { origin: "https://outra.example.com" })).status).toBe(403);
    expect((await request(null, { method: "GET" })).status).toBe(405);
    const lead = await (await request(envio())).json();
    expect(
      (
        await request(
          { tipo: "WHATSAPP_CLICADO", token: "a".repeat(64) },
          { path: `/api/quiz/leads/${lead.id}/eventos` },
        )
      ).status,
    ).toBe(404);
  });
  it("limita corpo e frequência", async () => {
    expect((await request({ ...envio(), extra: "a".repeat(13000) })).status).toBe(413);
    for (let i = 0; i < 59; i++) await request({});
    expect((await request(envio())).status).toBe(429);
  });
  it("falha sem expor dados quando o binding está indisponível", async () => {
    env.DB = {
      prepare: () => {
        throw new Error("erro banco com dados privados");
      },
    };
    const res = await request(envio());
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("privados");
  });
  it("limpa contadores vencidos sem apagar leads ou eventos comerciais", async () => {
    await request(envio());
    env.DB.sqlite.exec("UPDATE limites_quiz SET expira_em=0");
    let job: Promise<any> = Promise.resolve();
    await worker.scheduled({}, env, {
      waitUntil: (p: Promise<any>) => {
        job = p;
      },
    });
    await job;
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM limites_quiz").get().n).toBe(0);
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM leads_quiz").get().n).toBe(1);
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM eventos_quiz").get().n).toBe(1);
  });
});
