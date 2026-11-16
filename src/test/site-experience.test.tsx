import { createElement, type ComponentType } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "../routes/index";

const Home = Route.options.component as ComponentType;
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
});
describe("Apresentação e navegação", () => {
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
