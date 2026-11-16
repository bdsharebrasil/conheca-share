import { criarEventos } from "./events.js";
import { iniciarServicos } from "./services.js";
import { iniciarPortal } from "../portal/portal.js";

/** Uma instância por página; cada área libera seus próprios eventos ao sair. */
export function iniciarSite(root) {
  const $ = (s) => root.querySelector(s);
  const { on, limpar } = criarEventos();
  const limparServicos = iniciarServicos(root);
  const limparPortal = iniciarPortal(root);
  on($("#interest-choices"), "change", (e) => {
    const text = `Olá! Conheci a apresentação da Share Brasil e quero conversar sobre ${e.target.value}.`;
    $("#whatsapp-primary").href = `https://wa.me/5565981730641?text=${encodeURIComponent(text)}`;
  });
  $("#current-year").textContent = new Date().getFullYear();
  function progress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    $("#reading-progress").style.width = `${total > 0 ? (window.scrollY / total) * 100 : 0}%`;
  }
  on(window, "scroll", progress, { passive: true });
  on(window, "resize", progress);
  progress();
  return () => {
    limpar();
    limparPortal();
    limparServicos();
  };
}
