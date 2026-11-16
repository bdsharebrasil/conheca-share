import { calcularSaidaHero } from "./story-motion";

export function iniciarCinema(root: ParentNode = document) {
  const hero = root.querySelector<HTMLElement>(".hero-story");
  const header = root.querySelector<HTMLElement>(".site-header");
  const menu = root.querySelector<HTMLButtonElement>(".menu-toggle");
  const navigation = root.querySelector<HTMLElement>("#site-navigation");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let ultimoProgresso = -1;
  let ultimoMovimento: boolean | undefined;

  const update = () => {
    frame = 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 32);
    if (!hero) return;
    const progress = reduceMotion.matches
      ? 0
      : Math.max(
          0,
          Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight)),
        );
    if (progress === ultimoProgresso && reduceMotion.matches === ultimoMovimento) return;
    ultimoProgresso = progress;
    ultimoMovimento = reduceMotion.matches;
    const cena = calcularSaidaHero(progress);
    hero.dataset["heroProgress"] = cena.progresso.toFixed(4);
    Object.entries(cena.variaveis).forEach(([nome, valor]) => hero.style.setProperty(nome, valor));
  };
  const onScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  const closeMenu = () => {
    menu?.setAttribute("aria-expanded", "false");
    navigation?.classList.remove("is-open");
  };
  const toggleMenu = () => {
    const open = menu?.getAttribute("aria-expanded") !== "true";
    menu?.setAttribute("aria-expanded", String(open));
    navigation?.classList.toggle("is-open", open);
  };
  const onNavigation = (event: Event) => {
    if ((event.target as HTMLElement).closest("a")) closeMenu();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && menu?.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menu.focus();
    }
  };
  menu?.addEventListener("click", toggleMenu);
  navigation?.addEventListener("click", onNavigation);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  reduceMotion.addEventListener("change", update);
  update();
  return () => {
    menu?.removeEventListener("click", toggleMenu);
    navigation?.removeEventListener("click", onNavigation);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    reduceMotion.removeEventListener("change", update);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
