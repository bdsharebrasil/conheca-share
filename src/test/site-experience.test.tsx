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
    const portal = primeira.container.querySelector("#portal-experience")!;
    fireEvent.click(portal.querySelector("summary")!);
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

  it("mantém todas as mensagens acessíveis quando o visitante reduz o movimento", () => {
    movimento(true);
    const { container } = render(createElement(Home));
    const mensagens = container.querySelectorAll("[data-hero-panel]");
    expect(mensagens).toHaveLength(3);
    for (const mensagem of mensagens) {
      expect(mensagem.getAttribute("aria-hidden")).toBe("false");
      expect(mensagem.hasAttribute("inert")).toBe(false);
    }
  });
  it("sincroniza camadas em 30%, avança e volta ao mesmo ponto da rolagem", () => {
    movimento(false);
    const { container } = render(createElement(Home));
    const hero = container.querySelector<HTMLElement>(".hero-story")!;
    Object.defineProperty(hero, "offsetHeight", { value: 4000 });
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
    rolar(-900);
    expect(hero.dataset["storyProgress"]).toBe("0.3000");
    const pose = hero.getAttribute("style");
    rolar(-1800);
    expect(hero.dataset["storyProgress"]).toBe("0.6000");
    expect(hero.getAttribute("style")).not.toBe(pose);
    rolar(-900);
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
