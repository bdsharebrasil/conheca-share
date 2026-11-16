/** Saída de uma única cena; a próxima seção sobe pelo fluxo natural da página. */
export function calcularSaidaHero(valor: number) {
  const progresso = Math.min(1, Math.max(0, Number.isFinite(valor) ? valor : 0));
  return {
    progresso,
    variaveis: {
      "--hero-drift": `${progresso * 25}%`,
      "--hero-opacity": String(Math.max(0, Math.min(1, 1.05 - progresso * 1.8))),
      "--photo-scale": String(1 + progresso * 0.18),
      "--copy-opacity": String(Math.max(0, 1 - progresso * 1.5)),
      "--copy-y": `${progresso * -60}px`,
    },
  };
}
