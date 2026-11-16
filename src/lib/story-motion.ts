/** A pose depende somente da posição da rolagem, inclusive ao voltar. */
const limitar = (valor: number, inicio = 0, fim = 1) => Math.min(fim, Math.max(inicio, valor));
const trecho = (valor: number, inicio: number, fim: number) =>
  limitar((valor - inicio) / (fim - inicio));
const entre = (inicio: number, fim: number, progresso: number) =>
  inicio + (fim - inicio) * progresso;
const poses = [
  { p: 0, x: 0, y: 3, escala: 1, giro: -4, guinada: -9, inclinacao: 4 },
  { p: 0.32, x: -3, y: -2, escala: 1.04, giro: -10, guinada: 3, inclinacao: 8 },
  { p: 0.65, x: -2, y: 3, escala: 0.9, giro: 5, guinada: 10, inclinacao: -3 },
  { p: 1, x: 0, y: 0, escala: 1, giro: -3, guinada: -5, inclinacao: 2 },
];
export function calcularCena(valor: number) {
  const progresso = limitar(Number.isFinite(valor) ? valor : 0);
  const indice = Math.max(0, poses.findIndex((p) => p.p >= progresso) - 1);
  const de = poses[indice]!,
    ate = poses[indice + 1]!;
  const local = trecho(progresso, de.p, ate.p);
  const papel = trecho(progresso, 0.14, 0.49);
  const petroleo = trecho(progresso, 0.58, 0.94);
  const chegada = trecho(progresso, 0, 0.16);
  const cena = progresso < 0.4 ? 0 : progresso < 0.8 ? 1 : 2;
  return {
    progresso,
    cena,
    tema: progresso >= 0.25 && progresso < 0.7 ? "claro" : "escuro",
    variaveis: {
      "--story-progress": String(progresso),
      "--sheet-one-y": `${entre(118, 0, papel)}%`,
      "--sheet-one-tilt": `${entre(-10, 0, papel)}deg`,
      "--sheet-one-cut": `${entre(9, 0, papel)}%`,
      "--sheet-two-y": `${entre(118, 0, petroleo)}%`,
      "--sheet-two-tilt": `${entre(8, 0, petroleo)}deg`,
      "--sheet-two-cut": `${entre(0, 8, 1 - petroleo)}%`,
      "--plane-x": `${entre(de.x, ate.x, local)}vw`,
      "--plane-y": `${entre(de.y, ate.y, local)}vh`,
      "--plane-scale": String(entre(de.escala, ate.escala, local)),
      "--plane-roll": `${entre(de.giro, ate.giro, local)}deg`,
      "--plane-yaw": `${entre(de.guinada, ate.guinada, local)}deg`,
      "--plane-pitch": `${entre(de.inclinacao, ate.inclinacao, local)}deg`,
      "--backdrop-shift": `${entre(0, -9, chegada)}%`,
      "--intro-opacity": String(1 - trecho(progresso, 0.16, 0.34)),
      "--intro-y": `${entre(0, -80, trecho(progresso, 0.12, 0.36))}px`,
      "--control-progress": `${progresso * 100}%`,
    },
  };
}
export const posicoesDasCenas = [0, 0.53, 1] as const;
