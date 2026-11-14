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
  it("inicia sem contato e mostra o resultado com foto enquanto registra participação anônima", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(within(root).getByLabelText("Seu nome (opcional)")).toBeTruthy();
    fireEvent.submit(root.querySelector("form")!);
    preencherRespostas();
    expect(root.textContent).not.toContain("Perfil registrado");
    expect(root.querySelector(".quiz-profile")).toBeNull();
    expect(root.querySelector(".quiz-aircraft-photo img")?.getAttribute("src")).toBe(
      "https://pub-f4fb8ab5edc0402a840f54b4988012c2.r2.dev/quiz/SR20.png",
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).contato).toEqual({});
  });
  it("salva no D1 somente depois do consentimento e do término do quiz", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    iniciarComContato();
    preencherRespostas();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(root.textContent).not.toContain("Perfil registrado");
    expect(root.querySelector(".quiz-profile")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(payload.contato.nome).toBe("Pessoa Teste");
    expect(payload.respostas).toEqual(respostas);
    expect(payload.contato.cidade).toBe("");
  });
  it("mostra resultado se a gravação opcional falhar e permite repetir", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify(salvo()), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    iniciarComContato();
    preencherRespostas();
    await waitFor(() => expect(root.textContent).toContain("Tentar salvar novamente"));
    expect(root.querySelector("#quiz-whatsapp")).toBeTruthy();
    clicar("Tentar salvar novamente");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(root.textContent).not.toContain("Perfil registrado");
    expect(root.querySelector(".quiz-profile")).toBeNull();
    expect(fetchMock.mock.calls[1]![1].body).toBe(fetchMock.mock.calls[0]![1].body);
  });
  it("permite pular dados inválidos e nunca troca a foto por outro modelo", () => {
    fireEvent.input(within(root).getByLabelText("WhatsApp com DDD (opcional)"), {
      target: { value: "123" },
    });
    fireEvent.click(within(root).getByRole("checkbox"));
    fireEvent.submit(root.querySelector("form")!);
    expect(root.textContent).toContain("Confira os dados");
    clicar("Começar sem informar contato");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(salvo()), { status: 201 })),
    );
    preencherRespostas();
    const foto = root.querySelector<HTMLImageElement>("[data-aircraft-image]")!;
    fireEvent.error(foto);
    expect(foto.hidden).toBe(true);
    expect(root.textContent).toContain("Foto indisponível");
    expect(foto.src).not.toContain("hero-aircraft");
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
