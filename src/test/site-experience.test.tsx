import { createElement, StrictMode, type ComponentType } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "../routes/index";

const Home = Route.options.component as ComponentType;
const scrollOriginal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
function movimento(reduzido: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduzido,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (scrollOriginal)
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollOriginal);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
describe("Apresentação e navegação", () => {
  it("limpa interações e remonta o quiz e o portal sem duplicar eventos em StrictMode", () => {
    movimento(true);
    const rolarAte = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: rolarAte,
    });
    const montar = () => render(createElement(StrictMode, null, createElement(Home)));
    const primeira = montar();
    const menuAntigo = primeira.getByRole("button", { name: "Menu" });
    fireEvent.click(primeira.getByRole("button", { name: "Outra curiosidade ↻" }));
    expect(primeira.container.querySelector(".fact-row")).toHaveTextContent(
      "circunferência da Terra",
    );
    expect(primeira.container.querySelectorAll(".print-services")).toHaveLength(1);
    expect(primeira.container.querySelector("#service-panel .service-icon svg")).not.toBeNull();
    const iniciarAntigo = primeira.getByRole("button", { name: "Começar sem informar contato" });
    primeira.unmount();
    fireEvent.click(menuAntigo);
    expect(menuAntigo.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(iniciarAntigo);
    expect(rolarAte).not.toHaveBeenCalled();
    const segunda = montar();
    expect(segunda.getByRole("button", { name: "Começar sem informar contato" })).toBeEnabled();
    expect(segunda.container.querySelectorAll(".print-services")).toHaveLength(1);
    expect(document.querySelector('script[src="/app.js"], script[src="/quiz.js"]')).toBeNull();
    fireEvent.click(segunda.getByRole("button", { name: "Começar sem informar contato" }));
    expect(segunda.container.querySelector("input[name=uso]")).not.toBeNull();
    expect(rolarAte).toHaveBeenCalledTimes(1);
  });

  it("mostra só a abertura e a seção A Share logo depois, inclusive com movimento reduzido", () => {
    movimento(true);
    const { container, getByRole } = render(createElement(Home));
    const hero = container.querySelector<HTMLElement>(".hero-story")!;
    expect(hero.querySelectorAll("h1")).toHaveLength(1);
    expect(hero.querySelector("h2, .story-sheet, [data-hero-go]")).toBeNull();
    expect(hero.nextElementSibling?.id).toBe("essencia");
    expect(hero.style.getPropertyValue("--hero-opacity")).toBe("1");
    expect(getByRole("heading", { name: "Seu tempo, em outra altitude." })).toBeVisible();
    expect(
      getByRole("heading", { name: "Você conquista tempo. Nós cuidamos do caminho." }),
    ).toBeVisible();
  });
  it("monta e limpa o indicador cinematográfico, respeitando movimento reduzido", () => {
    movimento(true);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const { getByRole, unmount } = render(createElement(StrictMode, null, createElement(Home)));
    expect(document.querySelectorAll(".page-progress")).toHaveLength(1);
    fireEvent.click(getByRole("button", { name: "Voltar ao topo" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    unmount();
    expect(document.querySelectorAll(".page-progress")).toHaveLength(0);
  });
  it("revela títulos por palavra sem alterar o título do quiz", () => {
    movimento(true);
    const { container } = render(createElement(Home));
    expect(container.querySelector(".company-intro h2 .cin-title-word")).not.toBeNull();
    expect(container.querySelector(".quiz-section h2 .cin-title-word")).toBeNull();
    expect(container.querySelector(".company-intro h2")).toHaveAttribute(
      "aria-label",
      "Você conquista tempo. Nós cuidamos do caminho.",
    );
  });
  it("deixa a demonstração visível e funcional sem precisar expandir um painel", () => {
    movimento(true);
    const { container, getByRole } = render(createElement(Home));
    const portal = container.querySelector("#portal-experience")!;
    expect(portal.closest("details")).toBeNull();
    expect(getByRole("navigation", { name: "Demonstração do portal" })).toBeVisible();
    fireEvent.click(getByRole("button", { name: /^Simular custos$/ }));
    expect(getByRole("heading", { name: "O custo, antes do embarque." })).toBeVisible();
    expect(container.querySelector("#sim-form")).not.toBeNull();
  });
  it("sincroniza a saída em 30%, avança e volta ao mesmo ponto da rolagem", () => {
    movimento(false);
    const { container } = render(createElement(Home));
    const hero = container.querySelector<HTMLElement>(".hero-story")!;
    Object.defineProperty(hero, "offsetHeight", { value: 1000 });
    vi.stubGlobal("innerHeight", 1000);
    const fila: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      fila.push(callback);
      return fila.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const caixa = vi.spyOn(hero, "getBoundingClientRect");
    const rolar = (top: number) => {
      caixa.mockReturnValue({ top } as DOMRect);
      fireEvent.scroll(window);
      act(() => fila.shift()?.(0));
    };
    rolar(-300);
    expect(hero.dataset["heroProgress"]).toBe("0.3000");
    const pose = hero.getAttribute("style");
    rolar(-600);
    expect(hero.dataset["heroProgress"]).toBe("0.6000");
    expect(hero.getAttribute("style")).not.toBe(pose);
    rolar(-300);
    expect(hero.getAttribute("style")).toBe(pose);
  });
  it("fecha a navegação por Escape e devolve o foco ao botão Menu", () => {
    movimento(false);
    const { getByRole } = render(createElement(Home));
    const menu = getByRole("button", { name: "Menu" });
    fireEvent.click(menu);
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menu);
  });
});
