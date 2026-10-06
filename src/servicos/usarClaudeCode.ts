import { useEffect } from "react";
import { claudeCode, ouvirClaudeCode, type EventoClaude } from "../ponte/claudeCode";
import { useClaudeCode } from "../estado/claudeCode";
import { useConfig } from "../estado/configuracoes";
import { useInterface } from "../estado/interface";
import { tocarSom } from "../ponte/sons";
import { T } from "../textos/textos";

const TOLERANCIA_MS = 1500;

function abaLigada() {
  return useConfig.getState().claudeInstalado;
}

async function notificarSeEscondida(corpo: string) {
  const cfg = useConfig.getState();
  if (!cfg.notificarClaude || cfg.naoPerturbe) return;
  if (!document.hidden || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  new Notification(T.app.nome, { body: corpo });
}

function devolverAoTerminal(pedidoId: string) {
  useClaudeCode.getState().removerPedido(pedidoId);
  void claudeCode.decidir(pedidoId, "terminal").catch(() => undefined);
}

export function devolverPendentesAoTerminal() {
  for (const p of useClaudeCode.getState().pedidos) devolverAoTerminal(p.pedidoId);
}

function reagir(e: EventoClaude) {
  const estado = useClaudeCode.getState();
  const sessao = estado.sessoes[e.sessao];
  const projeto = sessao?.projeto ?? "";
  const silencio = useConfig.getState().naoPerturbe;
  switch (e.evento) {
    case "PermissionRequest": {
      const pedidoId = e.pedidoId;
      if (!pedidoId) return;
      void notificarSeEscondida(T.ilha.claude.notificacao.permissao(projeto));
      devolverAoTerminal(pedidoId);
      return;
    }
    case "Stop":
      if (silencio || !abaLigada()) return;
      estado.focar(e.sessao);
      void tocarSom("finish", "avisos");
      void notificarSeEscondida(T.ilha.claude.notificacao.terminou(projeto));
      useInterface.getState().avisar(T.ilha.claude.terminouAviso(projeto));
      return;
    case "StopFailure":
      if (!abaLigada()) return;
      void tocarSom("error", "avisos");
      void notificarSeEscondida(T.ilha.claude.notificacao.erro(projeto));
      useInterface.getState().avisar(T.ilha.claude.erroAviso(projeto));
      return;
    case "NikoPedidoEncerrado": {
      const motivo = e.dados.motivo;
      if (!abaLigada() || (motivo !== "expirou" && motivo !== "cancelado")) return;
      useInterface.getState().avisar(T.ilha.claude.pedidoEncerrado[motivo]);
      return;
    }
    case "Notification":
      if (!abaLigada()) return;
      if (sessao?.estado === "esperando") {
        void tocarSom("question", "avisos");
        const texto = T.ilha.claude.esperandoAviso(projeto);
        useInterface.getState().avisar(texto);
        void notificarSeEscondida(texto);
      } else if (sessao?.estado === "limite") {
        void tocarSom("rate", "avisos");
        const texto = T.ilha.claude.limiteAviso(projeto);
        useInterface.getState().avisar(texto);
        void notificarSeEscondida(texto);
      }
      return;
    default:
      return;
  }
}

function marcarInstalado(instalado: boolean) {
  const cfg = useConfig.getState();
  if (cfg.claudeInstalado !== instalado) cfg.definir({ claudeInstalado: instalado });
}

export function usarClaudeCode(ligado: boolean) {
  useEffect(() => {
    if (!ligado) return;
    claudeCode
      .instalacao()
      .then((e) => marcarInstalado(e.instalado || e.parcial || e.desatualizado))
      .catch(() => undefined);
  }, [ligado]);

  useEffect(() => {
    if (!ligado) {
      useClaudeCode.getState().definirConectado(false);
      return;
    }
    let conectadoEm = Date.now();
    return ouvirClaudeCode(
      (e) => {
        if (e.sessao) marcarInstalado(true);
        useClaudeCode.getState().aplicar(e);
        if (Date.parse(e.recebidoEm) >= conectadoEm - TOLERANCIA_MS) reagir(e);
      },
      (conectado) => {
        if (conectado) conectadoEm = Date.now();
        useClaudeCode.getState().definirConectado(conectado);
      },
    );
  }, [ligado]);
}
