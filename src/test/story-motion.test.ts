import { describe, expect, it } from "vitest";
import { calcularCena } from "../lib/story-motion";

describe("Linha do tempo guiada pela rolagem", () => {
  it("produz posições intermediárias em 30%, sem esperar uma troca de cena", () => {
    const inicio = calcularCena(0),
      meio = calcularCena(0.3),
      fim = calcularCena(1);
    expect(meio.progresso).toBe(0.3);
    expect(parseFloat(meio.variaveis["--sheet-one-y"])).toBeGreaterThan(0);
    expect(parseFloat(meio.variaveis["--sheet-one-y"])).toBeLessThan(118);
    expect(meio.variaveis["--plane-roll"]).not.toBe(inicio.variaveis["--plane-roll"]);
    expect(meio.variaveis["--plane-roll"]).not.toBe(fim.variaveis["--plane-roll"]);
    expect(meio.variaveis["--control-progress"]).toBe("30%");
  });
  it("retorna exatamente à mesma pose ao voltar, sem depender do tempo", () => {
    const ida = calcularCena(0.3);
    calcularCena(0.8);
    calcularCena(1);
    expect(calcularCena(0.3)).toEqual(ida);
  });
  it("mantém a animação contínua ao atravessar as mudanças de capítulo", () => {
    for (const limite of [0.14, 0.32, 0.4, 0.49, 0.58, 0.65, 0.8, 0.94]) {
      const antes = calcularCena(limite - 0.00001).variaveis;
      const depois = calcularCena(limite + 0.00001).variaveis;
      for (const nome of Object.keys(antes) as Array<keyof typeof antes>) {
        expect(Math.abs(parseFloat(antes[nome]) - parseFloat(depois[nome]))).toBeLessThan(0.02);
      }
    }
    expect(calcularCena(-1)).toEqual(calcularCena(0));
    expect(calcularCena(2)).toEqual(calcularCena(1));
    expect(calcularCena(NaN)).toEqual(calcularCena(0));
  });
});
