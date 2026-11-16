/** Saída de uma única cena; a próxima seção sobe pelo fluxo natural da página. */
export function calcularSaidaHero(valor: number) {
  const progresso = Math.min(1, Math.max(0, Number.isFinite(valor) ? valor : 0));
  return {
    progresso,
    variaveis: {
      "--hero-drift": `${progresso * 25}%`,
      "--hero-opacity": String(1 - progresso * 0.4),
      "--photo-scale": String(1 + progresso * 0.04),
      "--copy-opacity": String(1 - progresso * 0.7),
      "--copy-y": `${progresso * -50}px`,
    },
  };
}
