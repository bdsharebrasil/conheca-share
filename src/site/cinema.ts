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

  const headings = Array.from(root.querySelectorAll<HTMLElement>(".chapter h2"))
    .filter((heading) => !heading.closest(".quiz-section, [class*='portal']"))
    .map((heading) => {
      const ariaLabel = heading.getAttribute("aria-label");
      const words: HTMLElement[] = [];
      const labelContent = heading.cloneNode(true) as HTMLElement;
      labelContent.querySelectorAll("br").forEach((lineBreak) => {
        lineBreak.replaceWith(document.createTextNode(" "));
      });
      const accessibleText = labelContent.textContent?.trim().replace(/\s+/g, " ") ?? "";
      heading.setAttribute("aria-label", accessibleText);
      const wrapWords = (node: Node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const fragment = document.createDocumentFragment();
            (child.textContent ?? "").split(/(\s+)/).forEach((text) => {
              if (!text) return;
              if (/^\s+$/.test(text)) {
                fragment.append(document.createTextNode(text));
              } else {
                const word = document.createElement("span");
                word.className = "cin-title-word";
                word.setAttribute("aria-hidden", "true");
                word.textContent = text;
                words.push(word);
                fragment.append(word);
              }
            });
            child.parentNode?.replaceChild(fragment, child);
          } else if (child.nodeType === 1) {
            wrapWords(child);
          }
        });
      };
      wrapWords(heading);
      return { heading, ariaLabel, words };
    });

  const scenes = Array.from(root.querySelectorAll<HTMLElement>(".chapter")).filter(
    (section) => section !== hero,
  );
  scenes.forEach((scene, index) => {
    scene.classList.add("scene");
    scene.style.zIndex = String(index + 2);
  });
  const updateScenes = () => {
    const vh = window.innerHeight;
    scenes.forEach((scene) => {
      const height = scene.offsetHeight;
      scene.style.setProperty("--scene-top", `${Math.min(0, vh - height)}px`);
      if (reduceMotion.matches) {
        scene.style.removeProperty("--scene-cut");
        scene.style.removeProperty("--scene-tilt");
        scene.style.removeProperty("--scene-dim");
        return;
      }
      const top = scene.getBoundingClientRect().top;
      const enter = Math.max(0, Math.min(1, (vh - top) / Math.max(1, vh * 0.85)));
      const cut = (1 - enter) * Math.min(window.innerWidth * 0.09, 140);
      scene.style.setProperty("--scene-cut", `${cut.toFixed(1)}px`);
      scene.style.setProperty("--scene-tilt", `${((1 - enter) * -1.6).toFixed(3)}deg`);
      const next = scene.nextElementSibling as HTMLElement | null;
      const nextTop = next?.classList.contains("scene") ? next.getBoundingClientRect().top : vh;
      const cover = Math.max(0, Math.min(1, 1 - nextTop / vh));
      scene.style.setProperty("--scene-dim", (cover * 0.55).toFixed(3));
    });
  };

  const progressButton = document.createElement("button");
  progressButton.type = "button";
  progressButton.className = "page-progress";
  progressButton.setAttribute("aria-label", "Voltar ao topo");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 56 56");
  svg.setAttribute("aria-hidden", "true");
  const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  track.setAttribute("cx", "28");
  track.setAttribute("cy", "28");
  track.setAttribute("r", "24");
  const fill = track.cloneNode() as SVGCircleElement;
  fill.classList.add("page-progress__fill");
  svg.append(track, fill);
  const label = document.createElement("span");
  label.textContent = "0%";
  progressButton.append(svg, label);
  document.body.append(progressButton);
  const onProgressClick = () =>
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  progressButton.addEventListener("click", onProgressClick);

  const update = () => {
    frame = 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 32);
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pageProgress = Math.max(0, Math.min(1, window.scrollY / scrollRange));
    fill.style.strokeDashoffset = String(150.8 * (1 - pageProgress));
    label.textContent = `${Math.round(pageProgress * 100)}%`;
    progressButton.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.4);
    headings.forEach(({ heading, words }) => {
      const progress = reduceMotion.matches
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (window.innerHeight * 0.92 - heading.getBoundingClientRect().top) /
                Math.max(1, window.innerHeight * 0.4),
            ),
          );
      words.forEach((word, index) => {
        const reveal = Math.max(0, Math.min(1, progress * (words.length + 1.5) - index));
        word.style.opacity = String(0.2 + 0.8 * reveal);
      });
    });
    updateScenes();
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
    progressButton.removeEventListener("click", onProgressClick);
    progressButton.remove();
    headings.forEach(({ heading, ariaLabel, words }) => {
      words.forEach((word) => word.replaceWith(document.createTextNode(word.textContent ?? "")));
      if (ariaLabel === null) heading.removeAttribute("aria-label");
      else heading.setAttribute("aria-label", ariaLabel);
    });
    scenes.forEach((scene) => {
      scene.classList.remove("scene");
      ["z-index", "--scene-top", "--scene-cut", "--scene-tilt", "--scene-dim"].forEach((n) =>
        scene.style.removeProperty(n),
      );
    });
    if (frame) window.cancelAnimationFrame(frame);
  };
}
