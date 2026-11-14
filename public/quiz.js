import {
  PERGUNTAS,
  AERONAVES,
  VERSAO_QUIZ,
  recomendar,
  descreverPerfil,
  linkWhatsApp,
} from "./quiz-model.js";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const aviao =
  '<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M32 4c-3 0-4 5-4 10v10L7 38v5l21-7v13l-8 6v4l12-4 12 4v-4l-8-6V36l21 7v-5L36 24V14c0-5-1-10-4-10Z"/></svg>';
const seta = '<span class="arrow-ne" aria-hidden="true"></span>';
const lista = (arr) => arr.map((t) => `<li>${esc(t)}</li>`).join("");
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
    root.innerHTML =
      etapa < 0
        ? abertura()
        : etapa < total
          ? pergunta()
          : etapa === total
            ? formulario()
            : resultado();
    if (focar) {
      root.querySelector("[data-foco]")?.focus({ preventScroll: true });
      if (root.getBoundingClientRect().top < 80)
        root.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
    }
  }
  function abertura() {
    return `<div class="quiz-intro"><div class="quiz-intro-copy"><span class="quiz-pill">SEU PRÓXIMO CAPÍTULO</span><h3 data-foco tabindex="-1">Sua rotina tem um destino.<br><em>Vamos encontrar suas asas.</em></h3><p>Da fazenda aos negócios, da família aos novos planos. Descubra qual perfil de aeronave merece a sua atenção.</p><div class="quiz-intro-facts"><span><strong>8</strong> perguntas rápidas</span><span><strong>5</strong> perfis de aeronave</span><span><strong>Seu</strong> resultado explicado</span></div><button class="button primary" type="button" data-acao="comecar">Descobrir minha aeronave ${seta}</button><p class="quiz-note">Cerca de 2 minutos. Ao final, informe seu contato para registrar o perfil e conversar com a Share.</p></div><div class="quiz-intro-art" aria-hidden="true"><div class="quiz-radar"></div><span class="quiz-art-label">O PRÓXIMO DESTINO É SEU</span><span class="quiz-art-plane">${aviao}</span><div class="quiz-art-bottom"><span>CIRRUS · SENECA · MATRIX</span><span>CHEYENNE II · CITATION 550</span></div></div></div>`;
  }
  function progresso(titulo, numero) {
    return `<div class="quiz-topline"><a class="quiz-wordmark" href="#aeronave">SHARE <span>/ SEU PERFIL DE VOO</span></a><span>${esc(titulo)}</span></div><div class="quiz-progress" role="progressbar" aria-label="Etapas concluídas" aria-valuemin="0" aria-valuemax="${total + 1}" aria-valuenow="${numero}"><i style="width:${(numero / (total + 1)) * 100}%"></i></div>`;
  }
  function pergunta() {
    const p = PERGUNTAS[etapa];
    return `${progresso(`${etapa + 1} de ${total} perguntas`, etapa)}<div class="quiz-question-layout"><aside class="quiz-journey"><span class="quiz-journey-number">${String(etapa + 1).padStart(2, "0")}</span><p>UMA VIAGEM<br>COM A SUA CARA.</p><div class="quiz-journey-dots">${PERGUNTAS.map((_, i) => `<i class="${i < etapa ? "done" : i === etapa ? "current" : ""}"></i>`).join("")}</div><small>${etapa > 3 ? "Falta pouco para descobrir." : "Cada escolha aproxima você do seu próximo destino."}</small></aside><div><fieldset class="quiz-fieldset"><legend data-foco tabindex="-1">${esc(p.titulo)}</legend><p class="quiz-help" id="quiz-help">${esc(p.ajuda)}</p><div class="quiz-options" aria-describedby="quiz-help">${p.opcoes.map((o, i) => `<label class="quiz-option"><input type="radio" name="${p.id}" value="${o.valor}" ${respostas[p.id] === o.valor ? "checked" : ""}><span class="quiz-option-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span class="quiz-option-text">${esc(o.rotulo)}${o.detalhe ? `<small>${esc(o.detalhe)}</small>` : ""}</span><span class="quiz-choice-check" aria-hidden="true">✓</span></label>`).join("")}</div></fieldset><div class="quiz-nav"><button type="button" class="quiet" data-acao="voltar">← ${etapa === 0 ? "Introdução" : "Voltar"}</button><button type="button" class="button primary" data-acao="avancar" ${respostas[p.id] ? "" : "disabled"}>${etapa === total - 1 ? "Finalizar meu perfil" : "Continuar"} ${seta}</button></div></div></div>`;
  }
  function campo(nome, label, tipo = "text", extra = "") {
    return `<label class="quiz-field">${label}<input name="${nome}" type="${tipo}" value="${esc(contato[nome] || "")}" ${extra}></label>`;
  }
  function formulario() {
    return `${progresso("ÚLTIMO PASSO", total)}<div class="quiz-contact-heading"><span class="quiz-pill">SEU PERFIL ESTÁ PRONTO</span><h3 data-foco tabindex="-1">A próxima viagem começa com você.</h3><p>Registre seu contato para ver a recomendação completa e receber uma análise de cotas para o seu perfil.</p></div><form id="quiz-contact"><div class="quiz-form-grid">${campo("nome", "Seu nome *", "text", 'required minlength="2" maxlength="100" autocomplete="name"')}${campo("telefone", "WhatsApp com DDD *", "tel", 'required maxlength="22" autocomplete="tel" placeholder="(65) 99999-9999"')}${campo("cidade", "Sua cidade / base de partida *", "text", 'required minlength="2" maxlength="100" autocomplete="address-level2"')}${campo("rotas", "Rotas que você quer fazer (opcional)", "text", 'maxlength="250" placeholder="Ex.: Cuiabá, fazenda, São Paulo"')}<label class="quiz-field quiz-full">Quando você gostaria de começar?<select name="momento"><option value="EXPLORANDO" ${contato.momento === "EXPLORANDO" ? "selected" : ""}>Estou conhecendo as possibilidades</option><option value="ATE_3_MESES" ${contato.momento === "ATE_3_MESES" ? "selected" : ""}>Nos próximos 3 meses</option><option value="ATE_6_MESES" ${contato.momento === "ATE_6_MESES" ? "selected" : ""}>Entre 3 e 6 meses</option><option value="ESTE_ANO" ${contato.momento === "ESTE_ANO" ? "selected" : ""}>Mais adiante</option></select></label></div><div class="quiz-honeypot" aria-hidden="true"><label>Site pessoal<input name="website" tabindex="-1" autocomplete="off"></label></div><label class="quiz-consent"><input name="consentimento" type="checkbox" required ${contato.consentimento ? "checked" : ""}><span>Autorizo a Share Brasil a salvar meu contato e minhas respostas para preparar meu perfil e entrar em contato sobre cotas. <a href="#quiz-privacidade">Entenda o uso dos dados.</a></span></label><p class="quiz-error" role="alert">${esc(erro)}</p><div class="quiz-nav"><button type="button" class="quiet" data-acao="voltar" ${salvando ? "disabled" : ""}>← Revisar respostas</button><button type="submit" class="button primary" ${salvando ? "disabled" : ""}>${salvando ? "Registrando seu perfil…" : "Ver minha aeronave"} ${seta}</button></div><p class="quiz-note">Seu perfil será registrado mesmo que você não abra o WhatsApp. Você decide se quer enviar a mensagem.</p></form>`;
  }
  function resultado() {
    const r = recibo?.resultado || recomendar(respostas);
    const a = AERONAVES[r.principal],
      b = AERONAVES[r.segunda];
    return `${progresso("PERFIL CONCLUÍDO", total + 1)}<div class="quiz-result"><div class="quiz-result-banner"><div><span class="quiz-pill">${a ? "SEU PERFIL COMBINA COM" : "UM PLANO TÃO ÚNICO QUANTO VOCÊ"}</span><h3 data-foco tabindex="-1">${esc(a?.nome || "Uma análise personalizada")}</h3><p class="quiz-type">${esc(a?.tipo || "Vamos estudar sua missão com a equipe Share")}</p><p class="quiz-result-tagline">${esc(a?.perfil || "Seu grupo merece uma solução sob medida.")}</p></div><span class="quiz-result-seal" aria-hidden="true">${aviao}<small>SEU PERFIL<br>DE VOO</small></span></div><p class="quiz-lead">${esc(a?.resumo || "As respostas pedem uma conversa mais detalhada sobre passageiros e destinos. Vamos avaliar as possibilidades com você.")}</p><div class="quiz-cols"><div><h4>Saiba por que</h4><ul class="quiz-list ok">${lista(r.motivos.length ? r.motivos : ["A quantidade de passageiros pede uma avaliação específica.", "Seu perfil completo já está organizado para a conversa."])}</ul>${a ? `<details class="quiz-aircraft-details"><summary>Conheça essa opção +</summary><ul class="quiz-list">${lista(a.destaques)}</ul></details>` : ""}</div><div><h4>Vamos avaliar juntos</h4><ul class="quiz-list warn">${lista([...r.avisos, ...(a?.considerar || [])])}</ul></div></div>${b ? `<div class="quiz-second"><span>VALE COMPARAR TAMBÉM</span><strong>${esc(b.nome)}</strong><p>${esc(b.resumo)}</p></div>` : ""}<details class="quiz-profile"><summary>Rever meu perfil completo <span aria-hidden="true">+</span></summary><ul>${descreverPerfil(
      respostas,
    )
      .map((p) => `<li><span>${esc(p.titulo)}</span><strong>${esc(p.rotulo)}</strong></li>`)
      .join(
        "",
      )}${contato.rotas ? `<li><span>Rotas</span><strong>${esc(contato.rotas)}</strong></li>` : ""}</ul></details><div class="quiz-save-status ${recibo ? "saved" : "pending"}" role="status">${recibo ? `✓ Perfil registrado · referência ${esc(recibo.protocolo)}` : `Seu resultado está pronto, mas o contato ainda não foi salvo. ${esc(erro)} <button type="button" data-acao="tentar" ${salvando ? "disabled" : ""}>${salvando ? "Salvando…" : "Tentar salvar novamente"}</button>`}</div><div class="quiz-actions"><a id="quiz-whatsapp" class="button primary" href="${esc(linkWhatsApp(respostas, r, contato, recibo?.protocolo))}" target="_blank" rel="noopener noreferrer">Quero conhecer as cotas para o meu perfil ${seta}</a><button type="button" class="quiet" data-acao="refazer" ${salvando ? "disabled" : ""}>Explorar outro perfil ↻</button></div><p class="quiz-note">Sugestão inicial, sujeita à avaliação da Share. Configuração, passageiros, bagagem, pistas, disponibilidade e custos precisam ser confirmados. O WhatsApp abre com seu perfil; a mensagem só é enviada por você.</p></div>`;
  }
  async function salvar() {
    if (salvando) return;
    salvando = true;
    erro = "";
    render();
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
      }
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    "submit",
    (e) => {
      if (e.target.id !== "quiz-contact") return;
      e.preventDefault();
      if (salvando) return;
      const f = new FormData(e.target);
      contato = {
        nome: String(f.get("nome")).trim(),
        telefone: String(f.get("telefone")).trim(),
        cidade: String(f.get("cidade")).trim(),
        rotas: String(f.get("rotas")).trim(),
        momento: String(f.get("momento")),
        consentimento: f.get("consentimento") === "on",
      };
      const telefone = contato.telefone.replace(/\D/g, "");
      if (
        contato.nome.length < 2 ||
        contato.cidade.length < 2 ||
        !/^(?:55)?[1-9]{2}[2-9][0-9]{7,8}$/.test(telefone) ||
        !contato.consentimento
      ) {
        erro = "Confira seu nome, cidade, WhatsApp com DDD e a autorização de contato.";
        render();
        return;
      }
      envio = {
        chave_reenvio: chave,
        versao: VERSAO_QUIZ,
        respostas: { ...respostas },
        contato: { ...contato },
        origem,
        duracao_segundos: Math.min(86400, Math.floor((Date.now() - inicio) / 1000)),
        website: String(f.get("website") || ""),
      };
      salvar();
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
        case "comecar":
          etapa = 0;
          break;
        case "avancar":
          if (!respostas[PERGUNTAS[etapa].id]) return;
          etapa++;
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
