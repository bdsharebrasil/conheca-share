import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SITE_BODY } from "@/site-body";

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
    const root = document.documentElement;
    const scenes = Array.from(document.querySelectorAll<HTMLElement>(".chapter"));
    const chapterLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".chapter-bar a"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    scenes.forEach((scene, index) => {
      scene.dataset.scene = String(index + 1).padStart(2, "0");
      scene.style.setProperty("--scene-index", String(index));
    });

    const updateStory = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const maxScroll = document.documentElement.scrollHeight - viewport;
      const pageProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      root.style.setProperty("--page-progress", pageProgress.toFixed(4));

      let activeScene = scenes[0];
      scenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        const sceneLength = Math.max(rect.height - viewport * 0.2, viewport * 0.55);
        const progress = Math.min(1, Math.max(0, (viewport * 0.58 - rect.top) / sceneLength));
        scene.style.setProperty("--scene-progress", progress.toFixed(4));
        scene.style.setProperty("--scene-distance", `${Math.round(rect.top - viewport * 0.12)}px`);
        if (rect.top <= viewport * 0.45 && rect.bottom >= viewport * 0.45) activeScene = scene;
      });

      const activeId = activeScene?.id;
      chapterLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${activeId}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateStory);
    };

    updateStory();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    reduceMotion.addEventListener?.("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduceMotion.removeEventListener?.("change", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: SITE_BODY }} />;
}
