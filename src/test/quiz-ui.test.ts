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
function preencherRespostas() {
  for (const [i, [nome, valor]] of Object.entries(respostas).entries()) {
    const radio = root.querySelector(`input[name="${nome}"][value="${valor}"]`)!;
    fireEvent.click(radio);
    clicar(i === 7 ? "Finalizar meu perfil" : "Continuar");
  }
}
function iniciarComContato() {
  fireEvent.input(within(root).getByLabelText("Seu nome (opcional)"), {
    target: { value: "Pessoa Teste" },
  });
  fireEvent.input(within(root).getByLabelText("WhatsApp com DDD (opcional)"), {
    target: { value: "(65) 99999-1234" },
  });
  fireEvent.click(within(root).getByRole("checkbox"));
  fireEvent.submit(root.querySelector("form")!);
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
describe("Jornada e captura opcional", () => {
  it("inicia sem contato e mostra o resultado e a foto sem chamar a API", () => {
    expect(within(root).getByLabelText("Seu nome (opcional)")).toBeTruthy();
    fireEvent.submit(root.querySelector("form")!);
    preencherRespostas();
    expect(root.textContent).toContain("Seu resultado está pronto");
    expect(root.querySelector(".quiz-aircraft-photo img")?.getAttribute("src")).toBe(
      "/assets/hero-aircraft.jpg",
    );
  });
  it("salva no D1 somente depois do consentimento e do término do quiz", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    iniciarComContato();
    preencherRespostas();
    await waitFor(() => expect(root.textContent).toContain("Perfil registrado"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(payload.contato.nome).toBe("Pessoa Teste");
    expect(payload.respostas).toEqual(respostas);
    expect(payload.contato.cidade).toBe("Não informado");
  });
  it("mostra resultado se a gravação opcional falhar e permite repetir", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    iniciarComContato();
    preencherRespostas();
    await waitFor(() => expect(root.textContent).toContain("registro opcional não foi concluído"));
    expect(root.querySelector("#quiz-whatsapp")).toBeTruthy();
    clicar("Tentar salvar novamente");
    await waitFor(() => expect(root.textContent).toContain("Perfil registrado"));
    expect(fetchMock.mock.calls[1]![1].body).toBe(fetchMock.mock.calls[0]![1].body);
  });
  it("revisa preservando respostas e remove listeners na desmontagem", () => {
    fireEvent.submit(root.querySelector("form")!);
    fireEvent.click(root.querySelector('input[value="familia"]')!);
    clicar("Continuar");
    clicar("← Voltar");
    expect(root.querySelector<HTMLInputElement>('input[value="familia"]')!.checked).toBe(true);
    limpar();
    const anterior = root.innerHTML;
    clicar("Continuar");
    expect(root.innerHTML).toBe(anterior);
    limpar = iniciarQuiz(root);
    fireEvent.submit(root.querySelector("form")!);
    expect(root.textContent).toContain("1 de 8 perguntas");
  });
});
