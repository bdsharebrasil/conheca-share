import { calcularCena, posicoesDasCenas } from "./story-motion";

export function iniciarCinema(root: ParentNode = document) {
  const hero = root.querySelector<HTMLElement>(".hero-story");
  const header = root.querySelector<HTMLElement>(".site-header");
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-panel]"));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-hero-go]"));
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
    const range = Math.max(1, hero.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / range));
    if (progress === ultimoProgresso && reduceMotion.matches === ultimoMovimento) return;
    ultimoProgresso = progress;
    ultimoMovimento = reduceMotion.matches;
    const cena = calcularCena(progress);
    hero.dataset["storyProgress"] = cena.progresso.toFixed(4);
    hero.dataset["storyTheme"] = reduceMotion.matches ? "escuro" : cena.tema;
    Object.entries(cena.variaveis).forEach(([nome, valor]) => hero.style.setProperty(nome, valor));
    panels.forEach((panel, index) => {
      const visible = reduceMotion.matches || index === cena.cena;
      panel.classList.toggle("is-active", visible);
      panel.setAttribute("aria-hidden", String(!visible));
      panel.toggleAttribute("inert", !visible);
    });
    buttons.forEach((button, index) =>
      button.setAttribute("aria-pressed", String(index === cena.cena)),
    );
  };
  const onScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  const goToPanel = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-hero-go]");
    if (!hero || !button) return;
    const index = Number(button.dataset["heroGo"]);
    if (reduceMotion.matches) {
      panels[index]?.scrollIntoView({ block: "center" });
      return;
    }
    const start = hero.getBoundingClientRect().top + window.scrollY;
    const range = Math.max(1, hero.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: start + range * (posicoesDasCenas[index as 0 | 1 | 2] ?? 0),
      behavior: "smooth",
    });
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
  const controls = root.querySelector(".hero-scenes");
  controls?.addEventListener("click", goToPanel);
  menu?.addEventListener("click", toggleMenu);
  navigation?.addEventListener("click", onNavigation);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  reduceMotion.addEventListener("change", update);
  update();
  return () => {
    controls?.removeEventListener("click", goToPanel);
    menu?.removeEventListener("click", toggleMenu);
    navigation?.removeEventListener("click", onNavigation);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    reduceMotion.removeEventListener("change", update);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
