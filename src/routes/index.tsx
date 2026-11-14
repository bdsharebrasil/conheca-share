import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SITE_BODY } from "@/site-body";

const TITLE = "Conheça a Share Brasil · Seu tempo, em outra altitude";
const DESC =
  "Conheça a gestão compartilhada e privada da Share Brasil. Explore o Portal do Cliente, agende um voo demonstrativo e simule custos sem cadastro.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: "Share Brasil · Seu tempo, em outra altitude" },
      {
        property: "og:description",
        content:
          "Gestão profissional de aeronaves. Conheça a Share e experimente a vida de cotista, sem cadastro.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: "/site.css" },
      { rel: "stylesheet", href: "/portal-demo.css" },
      { rel: "stylesheet", href: "/quiz.css" },
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
