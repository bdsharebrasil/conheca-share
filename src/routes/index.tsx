import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SITE_BODY } from "@/site-body";
import { iniciarCinema } from "@/site/cinema";
// @ts-expect-error Existing vanilla DOM module, bundled by Vite.
import { iniciarSite } from "@/site/interactions.js";
// @ts-expect-error Existing vanilla DOM module, bundled by Vite.
import { iniciarQuiz } from "@/quiz/quiz.js";
import "@/styles/base.css";
import "@/styles/portal-demo.css";
import "@/styles/actions.css";
import "@/styles/institutional.css";
import "@/styles/cinema.css";
import "@/styles/quiz.css";

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
    links: [{ rel: "canonical", href: "https://conheca.share-brasil.com/" }],
  }),
  component: Index,
});

function Index() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const limparSite = iniciarSite(root.current);
    const limparCinema = iniciarCinema(root.current);
    const quiz = root.current.querySelector<HTMLElement>("#quiz-root");
    const limparQuiz = quiz
      ? iniciarQuiz(quiz, import.meta.env["VITE_QUIZ_API_URL"] || "https://api.share-brasil.com")
      : undefined;
    return () => {
      limparQuiz?.();
      limparCinema();
      limparSite();
    };
  }, []);
  return (
    <div
      ref={root}
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{ __html: SITE_BODY }}
    />
  );
}
