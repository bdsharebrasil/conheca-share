/** A pose depende somente da posição da rolagem, inclusive ao voltar. */
const limitar = (valor: number, inicio = 0, fim = 1) => Math.min(fim, Math.max(inicio, valor));
const trecho = (valor: number, inicio: number, fim: number) =>
  limitar((valor - inicio) / (fim - inicio));
const entre = (inicio: number, fim: number, progresso: number) =>
  inicio + (fim - inicio) * progresso;
export function calcularCena(valor: number) {
  const progresso = limitar(Number.isFinite(valor) ? valor : 0);
  const papel = trecho(progresso, 0.14, 0.49);
  const petroleo = trecho(progresso, 0.58, 0.94);
  const cena = progresso < 0.4 ? 0 : progresso < 0.8 ? 1 : 2;
  return {
    progresso,
    cena,
    tema: "escuro",
    variaveis: {
      "--story-progress": String(progresso),
      "--sheet-one-y": `${entre(118, 0, papel)}%`,
      "--sheet-one-tilt": `${entre(-10, 0, papel)}deg`,
      "--sheet-one-cut": `${entre(9, 0, papel)}%`,
      "--sheet-two-y": `${entre(118, 0, petroleo)}%`,
      "--sheet-two-tilt": `${entre(8, 0, petroleo)}deg`,
      "--sheet-two-cut": `${entre(0, 8, 1 - petroleo)}%`,
      "--photo-scale": String(entre(1, 1.065, progresso)),
      "--photo-y": `${entre(0, -1.5, progresso)}%`,
      "--photo-roll": `${entre(0, -0.6, progresso)}deg`,
      "--intro-opacity": String(1 - trecho(progresso, 0.16, 0.34)),
      "--intro-y": `${entre(0, -80, trecho(progresso, 0.12, 0.36))}px`,
      "--control-progress": `${progresso * 100}%`,
    },
  };
}
export const posicoesDasCenas = [0, 0.53, 1] as const;
