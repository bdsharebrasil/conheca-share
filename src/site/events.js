/** Eventos e animações pertencem à montagem atual e são liberados na saída. */
export function criarEventos() {
  const abort = new AbortController();
  const animations = new Set();
  const on = (target, event, handler, options = {}) =>
    target.addEventListener(event, handler, { ...options, signal: abort.signal });
  function animateScreen(el) {
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.getAnimations?.().forEach((a) => a.cancel());
    const animation = el.animate?.(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
    if (animation) {
      animations.add(animation);
      animation.finished.then(
        () => animations.delete(animation),
        () => animations.delete(animation),
      );
    }
  }
  return {
    on,
    animateScreen,
    limpar: () => {
      abort.abort();
      animations.forEach((animation) => animation.cancel());
    },
  };
}
