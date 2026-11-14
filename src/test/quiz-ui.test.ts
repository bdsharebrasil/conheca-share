import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, waitFor, within } from "@testing-library/dom";
// @ts-expect-error Plain browser module.
import { iniciarQuiz } from "../../public/quiz.js";
// @ts-expect-error Shared commercial rules.
import { recomendar } from "../../public/quiz-model.js";
let root: HTMLElement, limpar: () => void;
const respostas = {
  uso: "familia",
  pax: "1-2",
  distancia: "regional",
  horas: "ate-3",
  pista: "asfalto",
  prioridade: "custo",
  conforto: "indiferente",
  seguranca: "caps",
};
function clicar(nome: string) {
  fireEvent.click(within(root).getByRole("button", { name: nome }));
}
function preencher() {
  clicar("Descobrir minha aeronave");
  for (const [i, [nome, valor]] of Object.entries(respostas).entries()) {
    const radio = root.querySelector(`input[name="${nome}"][value="${valor}"]`)!;
    fireEvent.click(radio);
    clicar(i === 7 ? "Finalizar meu perfil" : "Continuar");
  }
  fireEvent.input(within(root).getByLabelText("Seu nome *"), { target: { value: "Pessoa Teste" } });
  fireEvent.input(within(root).getByLabelText("WhatsApp com DDD *"), {
    target: { value: "(65) 99999-1234" },
  });
  fireEvent.input(within(root).getByLabelText("Sua cidade / base de partida *"), {
    target: { value: "Cuiabá" },
  });
  fireEvent.click(within(root).getByRole("checkbox"));
}
const salvo = () => ({
  id: crypto.randomUUID(),
  protocolo: "SH-TESTE",
  token_evento: "b".repeat(64),
  resultado: recomendar(respostas),
});
beforeEach(() => {
  document.body.innerHTML = '<div id="quiz-root"></div>';
  root = document.getElementById("quiz-root")!;
  root.scrollIntoView = vi.fn();
  limpar = iniciarQuiz(root, "https://api.example.com");
});
afterEach(() => {
  limpar();
  vi.unstubAllGlobals();
});
describe("Jornada e confirmação de captura", () => {
  it("salva ao enviar o formulário, antes do clique no WhatsApp", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    preencher();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.submit(root.querySelector("form")!);
    await waitFor(() => expect(root.textContent).toContain("Perfil registrado"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(payload.contato.nome).toBe("Pessoa Teste");
    expect(payload.respostas).toEqual(respostas);
    const link = root.querySelector<HTMLAnchorElement>("#quiz-whatsapp")!;
    expect(new URL(link.href).searchParams.get("text")).toContain("Referência: SH-TESTE");
    expect(localStorage.length).toBe(0);
  });
  it("mostra resultado com aviso em falha e repete o mesmo envio na tentativa posterior", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    preencher();
    fireEvent.submit(root.querySelector("form")!);
    await waitFor(() => expect(root.textContent).toContain("ainda não foi salvo"));
    expect(root.querySelector("#quiz-whatsapp")).toBeTruthy();
    expect(root.textContent).not.toContain("Perfil registrado");
    clicar("Tentar salvar novamente");
    await waitFor(() => expect(root.textContent).toContain("Perfil registrado"));
    expect(fetchMock.mock.calls[1]![1].body).toBe(fetchMock.mock.calls[0]![1].body);
  });
  it("revisa preservando respostas e remove listeners na desmontagem", () => {
    clicar("Descobrir minha aeronave");
    fireEvent.click(root.querySelector('input[value="familia"]')!);
    clicar("Continuar");
    clicar("← Voltar");
    expect(root.querySelector<HTMLInputElement>('input[value="familia"]')!.checked).toBe(true);
    limpar();
    const anterior = root.innerHTML;
    clicar("Continuar");
    expect(root.innerHTML).toBe(anterior);
    limpar = iniciarQuiz(root);
    clicar("Descobrir minha aeronave");
    expect(root.textContent).toContain("1 de 8 perguntas");
  });
});
