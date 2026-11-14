import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SITE_BODY } from "@/site-body";

const TITLE = "AVIAÇÃO COMPARTILHADA, GESTÃO COMPLETA - CONHEÇA A SHARE BRASIL";
const SHARE_IMAGE = "https://conheca.share-brasil.com/assets/share-signature-logo.png";
const DESC =
  "A liberdade de ter uma aeronave. A tranquilidade de ter a Share cuidando de tudo. Conheça a gestão compartilhada e privada da Share Brasil.";

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
          detail: { apiBase: import.meta.env["VITE_QUIZ_API_URL"] || "" },
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
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: SITE_BODY }} />;
}
