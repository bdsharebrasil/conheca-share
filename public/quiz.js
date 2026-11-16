import { PERGUNTAS, AERONAVES, VERSAO_QUIZ, recomendar, linkWhatsApp } from "./quiz-model.js";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const aviao =
  '<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M32 4c-3 0-4 5-4 10v10L7 38v5l21-7v13l-8 6v4l12-4 12 4v-4l-8-6V36l21 7v-5L36 24V14c0-5-1-10-4-10Z"/></svg>';
const seta = '<span class="arrow-ne" aria-hidden="true"></span>';
const lista = (arr) => arr.map((t) => `<li>${esc(t)}</li>`).join("");
const simbolos = {
  pessoas:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
  mala: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v3h4v-3"/>',
  fazenda: '<path d="m3 12 9-8 9 8M5 10v11h14V10M9 21v-7h6v7M2 21h20"/>',
  rota: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M5 8v7a3 3 0 0 0 3 3h9M12 3h8v8m0-8-9 9"/>',
  tempo: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  pista: '<path d="m8 3-5 18M16 3l5 18M12 4v3m0 3v3m0 3v4"/>',
  equilibrio: '<path d="M12 3v18M4 7h16M6 7l-4 8h8L6 7m12 0-4 8h8l-4-8M7 21h10"/>',
  custo:
    '<circle cx="12" cy="12" r="9"/><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>',
  cabine: '<path d="M7 3v9a3 3 0 0 0 3 3h7v6M5 19h14M6 9h6a3 3 0 0 1 3 3v3"/>',
  motores:
    '<circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><path d="M6 5v14M18 5v14M2 12h8m4 0h8"/>',
  caps: '<path d="M3 10a9 9 0 0 1 18 0H3Zm0 0 9 10 9-10M8 10l4 10 4-10M12 20v3"/>',
  ajuda: '<path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01"/><circle cx="12" cy="12" r="10"/>',
};
function iconeOpcao(pergunta, valor) {
  if (pergunta === "pax")
    return `<span class="quiz-pax-number">${esc({ "1-2": "02", "3-4": "04", "5-6": "06", 7: "07", "8+": "08+" }[valor])}</span>`;
  const nome =
    ({
      uso: { familia: "pessoas", negocios: "mala", fazendas: "fazenda", equipe: "pessoas" },
      prioridade: { tempo: "tempo", equilibrio: "equilibrio", custo: "custo" },
      seguranca: { "dois-motores": "motores", caps: "caps", indiferente: "ajuda" },
    }[pergunta] || {})[valor] ||
    { distancia: "rota", horas: "tempo", pista: "pista", conforto: "cabine" }[pergunta] ||
    "ajuda";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${simbolos[nome]}</svg>`;
}
export function iniciarQuiz(root, apiBase = "") {
  let etapa = -1,
    respostas = {},
    contato = {},
    recibo = null,
    envio = null,
    salvando = false,
    erro = "",
    chave = crypto.randomUUID();
  const inicio = Date.now();
  const abort = new AbortController();
  const endpoint = `${apiBase.replace(/\/$/, "")}/api/quiz/leads`;
  const total = PERGUNTAS.length;
  const origem = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = new URLSearchParams(location.search).get(k);
    if (v) origem[k] = v.slice(0, 150);
  }
  function render(focar = false) {
    root.innerHTML = etapa < 0 ? abertura() : etapa < total ? pergunta() : resultado();
    if (focar) {
      root.querySelector("[data-foco]")?.focus({ preventScroll: true });
      if (
        root.getBoundingClientRect().top < 104 ||
        root.getBoundingClientRect().bottom > window.innerHeight
      )
        root.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
    }
  }
  function abertura() {
    return `<div class="quiz-intro"><div class="quiz-intro-copy"><span class="quiz-kicker">UMA CONVERSA SOBRE OS SEUS PLANOS</span><h3 data-foco tabindex="-1">Seu próximo voo<br><em>começa com você.</em></h3><p>Oito escolhas para entender sua rotina e explorar um perfil de aeronave. Simples, no seu tempo.</p><form id="quiz-start" class="quiz-start-form"><p class="quiz-contact-label">Se quiser, conte como podemos chamar você.</p><div class="quiz-form-grid">${campo("nome", "Seu nome (opcional)", "text", 'maxlength="100" autocomplete="name" placeholder="Seu nome"')}${campo("telefone", "WhatsApp com DDD (opcional)", "tel", 'maxlength="22" autocomplete="tel" placeholder="(65) 99999-9999"')}</div><label class="quiz-consent"><input name="consentimento" type="checkbox"><span>Autorizo a Share Brasil a salvar meus dados e respostas para preparar meu perfil e entrar em contato sobre gestão de cotas. Opcional.</span></label><p class="quiz-error" role="alert">${esc(erro)}</p><div class="quiz-start-actions"><button class="button primary" type="submit">Começar o teste ${seta}</button><button class="quiet" type="button" data-acao="sem-contato">Começar sem informar contato</button></div></form></div><aside class="quiz-intro-art"><img src="/assets/hero-aircraft.jpg" alt="Aeronave ilustrativa em voo ao entardecer" width="1920" height="1088" loading="lazy"><div class="quiz-intro-art-copy"><span class="quiz-kicker">SEU PERFIL, EM TRÊS PASSOS</span><ol><li><span>01</span><div>Conte seus planos<small>Seu grupo, suas rotas, sua rotina.</small></div></li><li><span>02</span><div>Explore seu perfil<small>Uma indicação inicial, com os motivos.</small></div></li><li><span>03</span><div>Converse com a Share<small>Gestão de cotas para avaliar com a equipe.</small></div></li></ol></div></aside></div>`;
  }
  function progresso(titulo, numero) {
    return `<div class="quiz-topline"><a class="quiz-wordmark" href="#aeronave">SHARE <span>/ SEU PERFIL DE VOO</span></a><span>${esc(titulo)}</span></div><div class="quiz-progress" role="progressbar" aria-label="Etapas concluídas" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${numero}"><i style="width:${(numero / total) * 100}%"></i></div>`;
  }
  function painelPerfil() {
    const itens = PERGUNTAS.filter((p) => respostas[p.id]);
    return `<span class="quiz-kicker">SEU PERFIL EM CONSTRUÇÃO</span><h4>Uma escolha<br>de cada vez.</h4>${itens.length ? `<dl class="quiz-profile-list">${itens.map((p) => `<div><dt>${esc(p.curto)}</dt><dd>${esc(p.opcoes.find((o) => o.valor === respostas[p.id]).rotulo)}</dd></div>`).join("")}</dl>` : `<p>Suas preferências aparecem aqui conforme você responde.</p><div class="quiz-profile-empty" aria-hidden="true">${aviao}</div>`}<p class="quiz-profile-footnote">A indicação aparece ao final.<br>Você pode voltar e ajustar suas escolhas.</p>`;
  }
  function pergunta() {
    const p = PERGUNTAS[etapa];
    return `${progresso(`${etapa + 1} de ${total} perguntas`, etapa)}<div class="quiz-question-layout"><div class="quiz-question"><span class="quiz-kicker">${String(etapa + 1).padStart(2, "0")} / ${esc(p.curto)}</span><fieldset class="quiz-fieldset"><legend data-foco tabindex="-1">${esc(p.titulo)}</legend><p class="quiz-help" id="quiz-help">${esc(p.ajuda)}</p><div class="quiz-options" aria-describedby="quiz-help">${p.opcoes.map((o) => `<label class="quiz-option"><input type="radio" name="${p.id}" value="${o.valor}" ${respostas[p.id] === o.valor ? "checked" : ""}><span class="quiz-option-icon" aria-hidden="true">${iconeOpcao(p.id, o.valor)}</span><span class="quiz-option-text">${esc(o.rotulo)}${o.detalhe ? `<small>${esc(o.detalhe)}</small>` : ""}</span><span class="quiz-choice-check" aria-hidden="true">✓</span></label>`).join("")}</div></fieldset><div class="quiz-selection" aria-live="polite">${respostas[p.id] ? "Escolha registrada. Continue quando quiser." : "Escolha a opção que mais combina com você."}</div><div class="quiz-nav"><button type="button" class="quiet" data-acao="voltar">← ${etapa === 0 ? "Introdução" : "Voltar"}</button><button type="button" class="button primary" data-acao="avancar" ${respostas[p.id] ? "" : "disabled"}>${etapa === total - 1 ? "Finalizar meu perfil" : "Continuar"} ${seta}</button></div></div><aside class="quiz-journey" aria-label="Resumo das suas escolhas">${painelPerfil()}</aside></div>`;
  }
  function campo(nome, label, tipo = "text", extra = "") {
    return `<label class="quiz-field">${label}<input name="${nome}" type="${tipo}" value="${esc(contato[nome] || "")}" ${extra}></label>`;
  }
  function resultado() {
    const r = recibo?.resultado || recomendar(respostas);
    const a = AERONAVES[r.principal],
      b = AERONAVES[r.segunda];
    const status =
      contato.consentimento && erro
        ? `<div class="quiz-save-status pending" role="status">${esc(erro)} <button type="button" data-acao="tentar" ${salvando ? "disabled" : ""}>${salvando ? "Salvando…" : "Tentar salvar novamente"}</button></div>`
        : "";
    return `${progresso("PERFIL CONCLUÍDO", total)}<div class="quiz-result"><div class="quiz-result-main">${a ? `<figure class="quiz-aircraft-photo"><img src="${esc(a.imagem)}" data-aircraft-image alt="${esc(a.nome)}" loading="lazy"><figcaption>${esc(a.nome)} · Foto ilustrativa do modelo</figcaption></figure>` : `<div class="quiz-custom-art" aria-hidden="true">${aviao}</div>`}<div class="quiz-result-banner"><span class="quiz-kicker">${a ? "UMA OPÇÃO PARA EXPLORAR" : "SEU PERFIL PEDE UMA CONVERSA"}</span><h3 data-foco tabindex="-1">${esc(a?.nome || "Uma análise personalizada")}</h3><p class="quiz-type">${esc(a?.tipo || "Vamos estudar sua missão com a equipe Share")}</p><p class="quiz-lead">${esc(a?.resumo || "Seu grupo e seus destinos merecem uma avaliação individual. Vamos entender as possibilidades com você.")}</p><span class="quiz-result-caption">Uma indicação inicial. A escolha final é construída com você.</span></div></div><div class="quiz-cols"><div><h4>Por que combina com você</h4><ul class="quiz-list ok">${lista(r.motivos.length ? r.motivos : ["A combinação de passageiros, cabine e pistas pede uma avaliação individual.", "Suas respostas ajudam a orientar a conversa."])}</ul>${a ? `<details class="quiz-aircraft-details"><summary>Mais sobre essa opção <span aria-hidden="true">+</span></summary><ul class="quiz-list">${lista(a.destaques)}</ul></details>` : ""}</div><div><h4>O que vamos avaliar juntos</h4><ul class="quiz-list warn">${lista([...r.avisos, ...(a?.considerar || [])])}</ul></div></div>${b ? `<div class="quiz-second"><div><span class="quiz-kicker">TAMBÉM VALE COMPARAR</span><strong>${esc(b.nome)}</strong></div><p>${esc(b.resumo)}</p></div>` : ""}${status}<div class="quiz-actions"><a id="quiz-whatsapp" class="button primary" href="${esc(linkWhatsApp(respostas, r, contato, recibo?.protocolo))}" target="_blank" rel="noopener noreferrer">Conversar sobre a gestão da minha cota ${seta}</a><button type="button" class="quiet" data-acao="refazer" ${salvando ? "disabled" : ""}>Explorar outro perfil ↻</button></div><p class="quiz-note">Sugestão inicial, sujeita à avaliação da Share. Configuração, passageiros, bagagem, pistas, disponibilidade e custos precisam ser confirmados. O WhatsApp abre com seu perfil; a mensagem só é enviada por você.</p></div>`;
  }
  async function salvar() {
    if (salvando) return;
    salvando = true;
    erro = "";
    render(true);
    const requisicao = new AbortController();
    const cancelar = () => requisicao.abort();
    abort.signal.addEventListener("abort", cancelar, { once: true });
    let tempoEsgotado = false;
    const limite = setTimeout(() => {
      tempoEsgotado = true;
      cancelar();
    }, 12000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envio),
        signal: requisicao.signal,
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok || !dados.id || !dados.protocolo || !dados.token_evento || !dados.resultado)
        throw new Error(dados.erro || "Tente novamente em instantes.");
      recibo = dados;
    } catch (e) {
      if (abort.signal.aborted) return;
      erro = tempoEsgotado
        ? "A conexão demorou mais que o esperado."
        : e.message === "Failed to fetch"
          ? "Confira sua conexão e tente novamente."
          : e.message;
    } finally {
      clearTimeout(limite);
      abort.signal.removeEventListener("abort", cancelar);
      salvando = false;
      if (!abort.signal.aborted) {
        etapa = total + 1;
        render(true);
      }
    }
  }
  root.addEventListener(
    "change",
    (e) => {
      if (e.target.matches(".quiz-option input")) {
        respostas[e.target.name] = e.target.value;
        root.querySelector('[data-acao="avancar"]').disabled = false;
        root.querySelector(".quiz-journey").innerHTML = painelPerfil();
        root.querySelector(".quiz-selection").textContent =
          "Escolha registrada. Continue quando quiser.";
      }
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    "submit",
    (e) => {
      if (e.target.id !== "quiz-start") return;
      e.preventDefault();
      const f = new FormData(e.target);
      contato = {
        nome: String(f.get("nome") || "").trim(),
        telefone: String(f.get("telefone") || "").trim(),
        cidade: "",
        rotas: "",
        momento: "EXPLORANDO",
        consentimento: f.get("consentimento") === "on",
      };
      const telefone = contato.telefone.replace(/\D/g, "");
      if (
        contato.consentimento &&
        ((contato.nome && contato.nome.length < 2) ||
          (telefone && !/^(?:55)?[1-9]{2}[2-9][0-9]{7,8}$/.test(telefone)))
      ) {
        erro = "Confira os dados que preencheu ou escolha começar sem informar contato.";
        render();
        return;
      }
      etapa = 0;
      render(true);
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    "click",
    (e) => {
      const wa = e.target.closest("#quiz-whatsapp");
      if (wa && recibo) {
        fetch(`${endpoint}/${recibo.id}/eventos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "WHATSAPP_CLICADO", token: recibo.token_evento }),
          keepalive: true,
        }).catch(() => {});
      }
      const btn = e.target.closest("[data-acao]");
      if (!btn || btn.disabled || salvando) return;
      switch (btn.dataset.acao) {
        case "sem-contato":
          contato = {};
          erro = "";
        case "comecar":
          etapa = 0;
          break;
        case "avancar":
          if (!respostas[PERGUNTAS[etapa].id]) return;
          etapa++;
          if (etapa === total) {
            envio = {
              chave_reenvio: chave,
              versao: VERSAO_QUIZ,
              respostas: { ...respostas },
              contato: contato.consentimento ? { ...contato } : {},
              origem,
              duracao_segundos: Math.min(86400, Math.floor((Date.now() - inicio) / 1000)),
              website: "",
            };
            salvar();
            return;
          }
          break;
        case "voltar":
          etapa--;
          erro = "";
          break;
        case "refazer":
          etapa = -1;
          respostas = {};
          contato = {};
          recibo = null;
          envio = null;
          erro = "";
          chave = crypto.randomUUID();
          break;
        case "tentar":
          salvar();
          return;
        default:
          return;
      }
      render(true);
    },
    { signal: abort.signal },
  );
  // Uma falha nunca troca um SR20 ou jato por uma foto de outro modelo.
  root.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!img.matches?.("[data-aircraft-image]")) return;
      img.hidden = true;
      const caption = img.closest("figure")?.querySelector("figcaption");
      if (caption) caption.textContent = "Foto indisponível no momento.";
    },
    { capture: true, signal: abort.signal },
  );
  render();
  return () => abort.abort();
}

// O módulo é cacheado pelo navegador. Eventos permitem montar/desmontar a rota.
let limparMontagem;
document.addEventListener("share:quiz:iniciar", (e) => {
  limparMontagem?.();
  const root = document.querySelector("#quiz-root");
  if (root) limparMontagem = iniciarQuiz(root, e.detail?.apiBase || "");
});
document.addEventListener("share:quiz:limpar", () => {
  limparMontagem?.();
  limparMontagem = null;
});
