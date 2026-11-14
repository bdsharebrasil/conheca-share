import { describe, expect, it } from "vitest";
import {
  PERGUNTAS,
  AERONAVES,
  recomendar,
  linkWhatsApp,
  respostasCompletas,
// @ts-expect-error Shared browser/Worker module is plain JavaScript.
} from "../../public/quiz-model.js";
const base = {
  uso: "negocios",
  pax: "3-4",
  distancia: "media",
  horas: "3-6",
  pista: "asfalto",
  prioridade: "equilibrio",
  conforto: "indiferente",
  seguranca: "indiferente",
};
describe("Triagem de aeronaves", () => {
  it("recomenda Cirrus para perfil regional enxuto", () => {
    expect(
      recomendar({
        ...base,
        uso: "familia",
        pax: "1-2",
        distancia: "regional",
        prioridade: "custo",
        seguranca: "caps",
      }).principal,
    ).toBe("cirrus");
  });
  it("recomenda Citation para viagens longas e prioridade ao tempo", () => {
    expect(
      recomendar({
        ...base,
        distancia: "muito-longa",
        horas: "12+",
        prioridade: "tempo",
        conforto: "sim",
      }).principal,
    ).toBe("citation");
  });
  it("não força uma indicação para grupo acima da faixa de triagem", () => {
    expect(recomendar({ ...base, pax: "7+" })).toMatchObject({
      principal: null,
      segunda: null,
      ranking: [],
    });
  });
  it("retira o jato de missões que incluem pistas não pavimentadas", () => {
    for (const pista of ["misto", "terra"])
      expect(recomendar({ ...base, pista }).ranking.map((r: { id: string }) => r.id)).not.toContain(
        "citation",
      );
  });
  it("rejeita respostas inválidas e incompletas", () => {
    expect(respostasCompletas({})).toBe(false);
    expect(() => recomendar({ ...base, uso: "qualquer" })).toThrow();
  });
  it("inclui contato, referência e perfil no WhatsApp, inclusive para avaliação personalizada", () => {
    const respostas = { ...base, pax: "7+" };
    const url = new URL(
      linkWhatsApp(
        respostas,
        recomendar(respostas),
        { nome: "Pessoa Teste", cidade: "Cuiabá", rotas: "A & B" },
        "SH-TESTE",
      ),
    );
    expect(url.hostname).toBe("wa.me");
    const msg = url.searchParams.get("text")!;
    expect(msg).toContain("Pessoa Teste");
    expect(msg).toContain("SH-TESTE");
    expect(msg).toContain("análise personalizada");
    expect(msg).toContain("Rotas desejadas: A & B");
  });
  it("mantém restrições em todas as combinações e permite os cinco perfis", () => {
    const encontrados = new Set();
    let combinacoes = 0;
    function percorrer(i: number, respostas: Record<string, string>) {
      if (i < PERGUNTAS.length) {
        const p = PERGUNTAS[i];
        for (const o of p.opcoes) percorrer(i + 1, { ...respostas, [p.id]: o.valor });
        return;
      }
      const r = recomendar(respostas);
      combinacoes++;
      for (const item of r.ranking) {
        const grupo = ({ "1-2": 2, "3-4": 4, "5-6": 6, "7+": 8 } as Record<string, number>)[
          respostas["pax"]!
        ]!;
        expect(AERONAVES[item.id].limitePerfil).toBeGreaterThanOrEqual(grupo);
        if (["misto", "terra"].includes(respostas["pista"]!)) expect(item.id).not.toBe("citation");
      }
      if (r.principal) encontrados.add(r.principal);
      else expect(respostas["pax"]).toBe("7+");
      expect(new Set(r.motivos).size).toBe(r.motivos.length);
    }
    percorrer(0, {});
    expect(combinacoes).toBe(23040);
    expect(encontrados.size).toBe(5);
  });
});
