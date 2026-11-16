import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SITE_BODY } from "@/site-body";
import { calcularCena, posicoesDasCenas } from "@/lib/story-motion";

const TITLE = "GESTÃO DE COTAS, ADMINISTRAÇÃO COMPLETA - CONHEÇA A SHARE BRASIL";
const SHARE_IMAGE = "https://conheca.share-brasil.com/assets/share-signature-logo.png";
const DESC =
  "Gestão de cotas e administração de aeronaves com a Share Brasil. Controle financeiro, regras de uso, manutenção e prestação de contas em um só lugar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://conheca.share-brasil.com/" },
      { property: "og:site_name", content: "Share Brasil" },
      { property: "og:image", content: SHARE_IMAGE },
      { property: "og:image:secure_url", content: SHARE_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "387" },
      { property: "og:image:height", content: "206" },
      { property: "og:image:alt", content: "Logo Share Brasil" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: SHARE_IMAGE },
      { name: "twitter:image:alt", content: "Logo Share Brasil" },
    ],
    links: [
      { rel: "stylesheet", href: "/site.css" },
      { rel: "stylesheet", href: "/portal-demo.css" },
      { rel: "stylesheet", href: "/quiz.css" },
      { rel: "stylesheet", href: "/action-colors.css" },
      { rel: "stylesheet", href: "/premium.css" },
      { rel: "stylesheet", href: "/scrollytelling.css" },
      { rel: "canonical", href: "https://conheca.share-brasil.com/" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    // The original interactive script runs against the rendered markup once.
    const s = document.createElement("script");
    s.type = "module";
    s.src = "/app.js";
    document.body.appendChild(s);
    const quiz = document.createElement("script");
    quiz.type = "module";
    quiz.src = "/quiz.js";
    quiz.onload = () =>
      document.dispatchEvent(
        new CustomEvent("share:quiz:iniciar", {
          detail: {
            apiBase: import.meta.env["VITE_QUIZ_API_URL"] || "https://api.share-brasil.com",
          },
        }),
      );
    quiz.onerror = () => {
      const root = document.querySelector("#quiz-root");
      if (root)
        root.innerHTML =
          "<p>Não foi possível carregar o quiz. Atualize a página ou fale com a Share pelo WhatsApp na seção de contato.</p>";
    };
    document.body.appendChild(quiz);
    return () => {
      document.dispatchEvent(new Event("share:quiz:limpar"));
      quiz.onload = null;
      quiz.onerror = null;
      quiz.remove();
      s.remove();
    };
  }, []);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero-story");
    const header = document.querySelector<HTMLElement>(".site-header");
    const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-hero-panel]"));
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-hero-go]"));
    const menu = document.querySelector<HTMLButtonElement>(".menu-toggle");
    const navigation = document.querySelector<HTMLElement>("#site-navigation");
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
      Object.entries(cena.variaveis).forEach(([nome, valor]) =>
        hero.style.setProperty(nome, valor),
      );
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
    const controls = document.querySelector(".hero-scenes");
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
  }, []);

  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: SITE_BODY }} />;
}
