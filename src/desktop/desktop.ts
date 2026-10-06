import { emitTo, listen } from "@tauri-apps/api/event";
import type { Rota, ServicoId } from "../tipos";

export type NomeJanela = "sistema";

interface InternosTauri {
  metadata?: { currentWindow?: { label?: string } };
}

const internos = typeof window !== "undefined" ? (window as unknown as { __TAURI_INTERNALS__?: InternosTauri }).__TAURI_INTERNALS__ : undefined;

export const NATIVO = Boolean(internos);

export const JANELA: NomeJanela | null = NATIVO ? ((internos?.metadata?.currentWindow?.label as NomeJanela | undefined) ?? "sistema") : null;

export type Comando =
  | { tipo: "irPara"; rota: Rota; parametros?: Record<string, string> }
  | { tipo: "abrirConexao"; id: ServicoId }
  | { tipo: "abrirBusca" }
  | { tipo: "abrirCaptura" };

const canal = !NATIVO && typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("niko-comandos") : null;

export function enviarComando(c: Comando) {
  if (NATIVO) {
    void emitTo("sistema", "niko-comandos", c).catch((erro) => console.error("Falha ao enviar comando para a janela do ADA", erro));
  } else canal?.postMessage(c);
  void mostrarSistema();
}

export function ouvirComandos(fn: (c: Comando) => void): () => void {
  if (NATIVO) {
    let ativo = true;
    let desligar: () => void = () => undefined;
    void listen<Comando>("niko-comandos", (e) => {
      if (ativo) fn(e.payload);
    }, { target: { kind: "WebviewWindow", label: "sistema" } }).then((f) => {
      if (ativo) desligar = f;
      else f();
    }).catch((erro) => console.error("Falha ao receber comandos na janela do ADA", erro));
    return () => {
      if (!ativo) return;
      ativo = false;
      desligar();
    };
  }
  if (!canal) return () => undefined;
  const aoReceber = (e: MessageEvent<Comando>) => fn(e.data);
  canal.addEventListener("message", aoReceber);
  return () => canal.removeEventListener("message", aoReceber);
}

export function foraDoSistema(): boolean {
  return NATIVO && JANELA !== "sistema";
}

async function invocar<T>(comando: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!NATIVO) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<T>(comando, args);
  } catch {
    return null;
  }
}

function ehLinkExterno(url: string): boolean {
  return /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
}

export function abrirLink(url: string) {
  if (!ehLinkExterno(url)) return;
  if (NATIVO) void invocar("abrir_link", { url });
  else window.open(url, "_blank", "noopener,noreferrer");
}

export function desviarLinksExternos() {
  if (!NATIVO) return;
  document.addEventListener(
    "click",
    (e) => {
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !ehLinkExterno(link.href)) return;
      e.preventDefault();
      abrirLink(link.href);
    },
    true,
  );
}

export function mostrarSistema() {
  return invocar("mostrar_sistema");
}

export async function janelaAtual() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export async function ouvirEvento(nome: string, fn: () => void): Promise<() => void> {
  if (!NATIVO) return () => undefined;
  const { listen } = await import("@tauri-apps/api/event");
  return listen(nome, fn);
}

function enviarPelaPonte(base: string, token: string | null) {
  const original = window.fetch.bind(window);
  window.fetch = (entrada: RequestInfo | URL, opcoes?: RequestInit) => {
    if (typeof entrada === "string" && entrada.startsWith("/ponte")) {
      const cabecalhos = new Headers(opcoes?.headers);
      if (token) cabecalhos.set("x-niko-token", token);
      return original(`${base}${entrada}`, { ...opcoes, headers: cabecalhos });
    }
    return original(entrada, opcoes);
  };
}

export async function prepararPonte() {
  if (NATIVO && window.location.hostname === "tauri.localhost") {
    const [token, porta] = await Promise.all([invocar<string>("token_ponte"), invocar<number>("porta_ponte")]);
    enviarPelaPonte(`http://127.0.0.1:${porta ?? 47831}`, token);
    return;
  }
  const tokenDeDesenvolvimento = document.querySelector<HTMLMetaElement>('meta[name="niko-token"]')?.content;
  if (tokenDeDesenvolvimento) enviarPelaPonte("", tokenDeDesenvolvimento);
}

export async function agirNaJanela(acao: "focar" | "minimizar" | "fechar", id: string) {
  try {
    await fetch(`/ponte/janelas/${acao}`, { method: "POST", headers: { "x-niko": "1", "content-type": "application/json" }, body: JSON.stringify({ janela: id }) });
  } catch {
    return;
  }
}
