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
    expect(recomendar({ ...base, pax: "8+" })).toMatchObject({
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
  it("diferencia sete passageiros de uma faixa aberta de oito ou mais", () => {
    expect(
      recomendar({ ...base, pax: "7", prioridade: "tempo" })
        .ranking.map((r: { id: string }) => r.id)
        .sort(),
    ).toEqual(["citation", "hawker400a"]);
    expect(recomendar({ ...base, pax: "7", pista: "terra" }).principal).toBeNull();
  });
  it("mantém o Meridian monomotor sem pontos por preferência bimotora", () => {
    expect(AERONAVES.meridian).toMatchObject({
      motores: 1,
      pressurizada: true,
      familia: "turboelice",
    });
    const preferencia = PERGUNTAS.find((p: any) => p.id === "seguranca").opcoes.find(
      (o: any) => o.valor === "dois-motores",
    );
    expect(preferencia.pontos.meridian).toBeUndefined();
  });
  it("recomenda Meridian para cabine pressurizada em grupo pequeno com equilíbrio", () => {
    expect(
      recomendar({
        ...base,
        pax: "3-4",
        conforto: "sim",
        prioridade: "equilibrio",
        seguranca: "indiferente",
      }).principal,
    ).toBe("meridian");
  });
  it("recomenda 400A para perfil de tempo e Citation para trajetos de maior distância", () => {
    const perfil = {
      ...base,
      pax: "7",
      horas: "12+",
      conforto: "sim",
      prioridade: "tempo",
      seguranca: "dois-motores",
    };
    expect(recomendar({ ...perfil, distancia: "media" }).principal).toBe("hawker400a");
    expect(recomendar({ ...perfil, distancia: "muito-longa" }).principal).toBe("citation");
  });
  it("rejeita respostas inválidas e incompletas", () => {
    expect(respostasCompletas({})).toBe(false);
    expect(() => recomendar({ ...base, uso: "qualquer" })).toThrow();
  });
  it("inclui contato, referência e perfil no WhatsApp, inclusive para avaliação personalizada", () => {
    const respostas = { ...base, pax: "8+" };
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
  it("mantém restrições em todas as combinações e permite os sete perfis", () => {
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
        const grupo = ({ "1-2": 2, "3-4": 4, "5-6": 6, "7": 7, "8+": 8 } as Record<string, number>)[
          respostas["pax"]!
        ]!;
        expect(AERONAVES[item.id].limitePerfil).toBeGreaterThanOrEqual(grupo);
        if (["misto", "terra"].includes(respostas["pista"]!))
          expect(AERONAVES[item.id].familia).not.toBe("jato");
        if (respostas["conforto"] === "sim") expect(AERONAVES[item.id].pressurizada).toBe(true);
      }
      if (r.principal) encontrados.add(r.principal);
      else expect(["7", "8+"]).toContain(respostas["pax"]);
      expect(new Set(r.motivos).size).toBe(r.motivos.length);
    }
    percorrer(0, {});
    expect(combinacoes).toBe(28800);
    expect(encontrados.size).toBe(7);
  });
});
