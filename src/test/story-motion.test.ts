import { describe, expect, it } from "vitest";
import { calcularSaidaHero } from "../site/story-motion";

describe("Saída do hero guiada pela rolagem", () => {
  it("move e reduz a abertura progressivamente, sem cenários intermediários", () => {
    const inicio = calcularSaidaHero(0),
      meio = calcularSaidaHero(0.3),
      fim = calcularSaidaHero(1);
    expect(meio.progresso).toBe(0.3);
    expect(parseFloat(meio.variaveis["--hero-drift"])).toBeGreaterThan(
      parseFloat(inicio.variaveis["--hero-drift"]),
    );
    expect(parseFloat(meio.variaveis["--hero-drift"])).toBeLessThan(
      parseFloat(fim.variaveis["--hero-drift"]),
    );
    expect(parseFloat(meio.variaveis["--hero-opacity"])).toBeLessThan(1);
    expect(parseFloat(meio.variaveis["--hero-opacity"])).toBeCloseTo(0.51);
    expect(parseFloat(meio.variaveis["--photo-scale"])).toBeCloseTo(1.054);
    expect(parseFloat(meio.variaveis["--copy-opacity"])).toBeGreaterThan(0);
    expect(calcularSaidaHero(0.6).variaveis["--hero-opacity"]).toBe("0");
  });
  it("retorna exatamente à mesma composição ao voltar", () => {
    const ida = calcularSaidaHero(0.3);
    calcularSaidaHero(0.6);
    calcularSaidaHero(1);
    expect(calcularSaidaHero(0.3)).toEqual(ida);
  });
  it("mantém continuidade e limita os extremos da rolagem", () => {
    for (const limite of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const antes = calcularSaidaHero(limite - 0.00001).variaveis;
      const depois = calcularSaidaHero(limite + 0.00001).variaveis;
      for (const nome of Object.keys(antes) as Array<keyof typeof antes>) {
        expect(Math.abs(parseFloat(antes[nome]) - parseFloat(depois[nome]))).toBeLessThan(0.02);
      }
    }
    expect(calcularSaidaHero(-1)).toEqual(calcularSaidaHero(0));
    expect(calcularSaidaHero(2)).toEqual(calcularSaidaHero(1));
    expect(calcularSaidaHero(NaN)).toEqual(calcularSaidaHero(0));
  });
});
