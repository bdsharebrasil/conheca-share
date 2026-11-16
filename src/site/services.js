import { criarEventos } from "./events.js";
export function iniciarServicos(root) {
  const $ = (s) => root.querySelector(s);
  const { on, animateScreen, limpar } = criarEventos();
  const services = [
    [
      '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 11 1.5 1.5L12 10M14 11h2M8 17h8"/></svg>',
      "Sua viagem começa antes do embarque.",
      "A coordenação reúne as informações da sua viagem e organiza as etapas com a equipe de operação.",
      [
        "Reservas e escala de tripulantes",
        "Planejamento e apoio à logística",
        "Acompanhamento do voo e do pós-voo",
      ],
    ],
    [
      "⚙",
      "Atenção ao que mantém você voando.",
      "A gestão de manutenção organiza os controles e acompanha as necessidades técnicas da aeronave.",
      [
        "Vencimentos, horas e cadernetas",
        "Cotações de peças e serviços",
        "Acompanhamento de seguros e documentos",
      ],
    ],
    [
      "▤",
      "Clareza para cada decisão.",
      "O financeiro conecta as despesas da aeronave aos critérios de rateio e ao fechamento entre cotistas.",
      [
        "Custeio mensal e controle de cobranças",
        "Balanço entre participantes",
        "Despesas de viagem e comprovantes",
      ],
    ],
    [
      '<span class="arrow-ne" aria-hidden="true"></span>',
      "Informação que dá perspectiva.",
      "Indicadores transformam o histórico da operação em uma visão do uso e dos custos ao longo do tempo.",
      [
        "Consumo médio e horas voadas",
        "Custos por hora, quilômetro e assento",
        "Projeções de curto, médio e longo prazo",
      ],
    ],
    [
      "♙",
      "Pessoas preparadas para a operação.",
      "O acompanhamento da tripulação organiza os requisitos de qualificação e a rotina de quem vai voar.",
      [
        "Controle de habilitações e exames",
        "Treinamentos e seleção de tripulantes",
        "Organização da equipe por operação",
      ],
    ],
  ];
  function serviceMarkup(i) {
    const [icon, title, copy, items] = services[i];
    return `<span class="service-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${copy}</p><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  }
  function setService(i, focus = false) {
    root.querySelectorAll("[data-service]").forEach((b) => {
      const active = Number(b.dataset.service) === i;
      b.setAttribute("aria-selected", active);
      b.tabIndex = active ? 0 : -1;
      if (active && focus) b.focus();
    });
    const panel = $("#service-panel");
    panel.hidden = false;
    panel.innerHTML = serviceMarkup(i);
    panel.setAttribute("aria-labelledby", `service-tab-${i}`);
    $(`.service-nav [data-service="${i}"]`).after(panel);
    animateScreen(panel);
  }
  function closeService() {
    root
      .querySelectorAll("[data-service]")
      .forEach((b) => b.setAttribute("aria-selected", "false"));
    $("#service-panel").hidden = true;
  }
  on($(".service-nav"), "click", (e) => {
    const b = e.target.closest("[data-service]");
    if (!b) return;
    const i = Number(b.dataset.service);
    if (b.getAttribute("aria-selected") === "true" && !$("#service-panel").hidden) closeService();
    else setService(i);
  });
  on($(".service-nav"), "keydown", (e) => {
    const b = e.target.closest("[data-service]");
    if (!b) return;
    const i = Number(b.dataset.service);
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      setService(
        e.key === "Home" ? 0 : e.key === "End" ? 4 : (i + (e.key === "ArrowDown" ? 1 : 4)) % 5,
        true,
      );
    }
  });
  // A versão de impressão reúne todas as frentes e as telas demonstrativas.
  const printServices = document.createElement("div");
  printServices.className = "print-services";
  printServices.innerHTML = services
    .map((_, i) => `<article>${serviceMarkup(i)}</article>`)
    .join("");
  $(".services").after(printServices);
  setService(0);
  return () => {
    limpar();
    printServices.remove();
  };
}
