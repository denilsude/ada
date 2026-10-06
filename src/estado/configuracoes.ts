import { create } from "zustand";
import { persist } from "zustand/middleware";
import { armazenamento, chave } from "../ponte/armazenamento";
import type { AgenteId, CartaoConfirmacao, Rota } from "../tipos";
import type { CategoriaSom } from "../ponte/sons";

export type Tema = "claro" | "escuro" | "sistema";
export type Paleta = "padrao" | "areia" | "grafite" | "floresta" | "oceano";
export type BlocoInicio =
  | "time" | "hoje" | "foco" | "financas" | "conexoes" | "revisoes" | "consumo" | "mapa" | "conquistas";

export interface ItemBarra {
  rota: Rota;
  nome?: string;
  visivel: boolean;
}

export const BARRA_PADRAO: ItemBarra[] = [
  { rota: "inicio", visivel: true },
  { rota: "chat", visivel: true },
  { rota: "escritorio", visivel: true },
  { rota: "conexoes", visivel: true },
  { rota: "journal", visivel: true },
  { rota: "estudos", visivel: true },
  { rota: "financas", visivel: true },
  { rota: "metas", visivel: true },
  { rota: "calendario", visivel: true },
  { rota: "ia", visivel: true },
  { rota: "consumo", visivel: true },
  { rota: "conquistas", visivel: true },
];

export const GRUPO_DA_ROTA: Record<Rota, "principal" | "organizacao" | "ferramentas"> = {
  inicio: "principal",
  chat: "principal",
  escritorio: "principal",
  conexoes: "principal",
  journal: "organizacao",
  estudos: "organizacao",
  financas: "organizacao",
  metas: "organizacao",
  calendario: "organizacao",
  ia: "ferramentas",
  consumo: "ferramentas",
  conquistas: "ferramentas",
  configuracoes: "ferramentas",
};

export const BLOCOS_INICIO_PADRAO: { id: BlocoInicio; visivel: boolean }[] = [
  { id: "time", visivel: true },
  { id: "hoje", visivel: true },
  { id: "foco", visivel: true },
  { id: "financas", visivel: true },
  { id: "revisoes", visivel: true },
  { id: "conexoes", visivel: true },
  { id: "consumo", visivel: true },
  { id: "mapa", visivel: true },
  { id: "conquistas", visivel: true },
];

export interface Configuracoes {
  nome: string;
  foto: string | null;
  viradaAs4h: boolean;
  tema: Tema;
  paleta: Paleta;
  destaque: string | null;
  escala: number;
  reduzirAnimacoes: boolean;
  modoLeveEscritorio: boolean;
  barraLateral: ItemBarra[];
  barraRecolhida: boolean;
  gruposFechados: string[];
  blocosInicio: { id: BlocoInicio; visivel: boolean }[];
  pomodoro: { foco: number; curta: number; longa: number; ciclos: number; autoProxima: boolean; tique: boolean };
  agua: { meta: number; copo: number };
  sons: { ligado: boolean; volume: number; categorias: Record<CategoriaSom, boolean> };
  agentes: { nomes: Record<AgenteId, string>; cargos: Record<AgenteId, string>; inatividadeMin: number; favorito: AgenteId };
  consumo: { precoEntrada: number; precoSaida: number; limiteMensal: number; lerPlanos: boolean };
  ia: { provedorId: string | null; modelo: string; reservas: string[]; modelos: Record<string, string>; autoAprovar: CartaoConfirmacao["tipo"][] };
  privacidade: boolean;
  naoPerturbe: boolean;
  nuncaFinanceiro: boolean;
  pausarConexoes: boolean;
  conquistasAtivas: boolean;
  receberStripe: boolean;
  primeiraExecucaoFeita: boolean;
  notificarClaude: boolean;
  claudeInstalado: boolean;
  funcoesDesligadas: ("journal" | "estudos" | "financas" | "metas" | "calendario")[];
}

export const CONFIG_PADRAO: Configuracoes = {
  nome: "",
  foto: null,
  viradaAs4h: false,
  tema: "claro",
  paleta: "padrao",
  destaque: null,
  escala: 1,
  reduzirAnimacoes: false,
  modoLeveEscritorio: false,
  barraLateral: BARRA_PADRAO,
  barraRecolhida: false,
  gruposFechados: [],
  blocosInicio: BLOCOS_INICIO_PADRAO,
  pomodoro: { foco: 25, curta: 5, longa: 15, ciclos: 4, autoProxima: false, tique: false },
  agua: { meta: 2000, copo: 250 },
  sons: {
    ligado: true,
    volume: 0.15,
    categorias: { personagens: true, avisos: true, pomodoro: true, interface: true },
  },
  agentes: {
    nomes: { organizador: "Rubi", tutor: "Nanquim", operador: "Sol", java: "Java" },
    cargos: { organizador: "Gerente de projetos", tutor: "Professor", operador: "Analista de operações", java: "Engenheiro de software" },
    inatividadeMin: 10,
    favorito: "organizador",
  },
  consumo: { precoEntrada: 0, precoSaida: 0, limiteMensal: 20, lerPlanos: false },
  ia: { provedorId: null, modelo: "", reservas: [], modelos: {}, autoAprovar: [] },
  privacidade: false,
  naoPerturbe: false,
  nuncaFinanceiro: true,
  pausarConexoes: false,
  conquistasAtivas: true,
  receberStripe: false,
  primeiraExecucaoFeita: false,
  notificarClaude: false,
  claudeInstalado: false,
  funcoesDesligadas: [],
};

interface AcoesConfig {
  definir: (parcial: Partial<Configuracoes>) => void;
  restaurar: () => void;
}

export const useConfig = create<Configuracoes & AcoesConfig>()(
  persist(
    (set) => ({
      ...CONFIG_PADRAO,
      definir: (parcial) => set(parcial),
      restaurar: () => set({ ...CONFIG_PADRAO, primeiraExecucaoFeita: true }),
    }),
    {
      name: chave("configuracoes"),
      storage: armazenamento,
      version: 10,
      migrate: (salvo) => {
        const { ilha: _ilha, dock: _dock, iniciarComWindows: _iniciarComWindows, esconderTelaCheia: _esconderTelaCheia, appsEsconder: _appsEsconder, ...dados } =
          (salvo ?? {}) as Record<string, unknown>;
        const s = dados as Partial<Configuracoes>;
        if (s.ia) s.ia = { ...s.ia, reservas: s.ia.reservas ?? [], modelos: s.ia.modelos ?? (s.ia.provedorId && s.ia.modelo ? { [s.ia.provedorId]: s.ia.modelo } : {}) };
        return s as Configuracoes & AcoesConfig;
      },
      merge: (persistido, atual) => {
        const {
          ilha: _ilha,
          dock: _dock,
          iniciarComWindows: _iniciarComWindows,
          esconderTelaCheia: _esconderTelaCheia,
          appsEsconder: _appsEsconder,
          ...dadosSalvos
        } = (persistido ?? {}) as Record<string, unknown>;
        const salvo = dadosSalvos as Partial<Configuracoes>;
        const barraSalva = Array.isArray(salvo.barraLateral) ? salvo.barraLateral.filter((i) => BARRA_PADRAO.some((p) => p.rota === i.rota)) : BARRA_PADRAO;
        const barraLateral = [...barraSalva];
        BARRA_PADRAO.forEach((item, i) => {
          if (barraLateral.some((x) => x.rota === item.rota)) return;
          const seguinte = BARRA_PADRAO.slice(i + 1).find((p) => barraLateral.some((x) => x.rota === p.rota));
          const posicao = seguinte ? barraLateral.findIndex((x) => x.rota === seguinte.rota) : barraLateral.length;
          barraLateral.splice(posicao, 0, item);
        });
        return {
          ...atual,
          ...salvo,
          barraLateral,
          pomodoro: { ...CONFIG_PADRAO.pomodoro, ...salvo.pomodoro },
          agua: { ...CONFIG_PADRAO.agua, ...salvo.agua },
          sons: { ...CONFIG_PADRAO.sons, ...salvo.sons },
          agentes: {
            ...CONFIG_PADRAO.agentes,
            ...salvo.agentes,
            cargos: Object.fromEntries((Object.keys(CONFIG_PADRAO.agentes.cargos) as AgenteId[]).map((a) => {
              const cargo = salvo.agentes?.cargos?.[a];
              return [a, cargo && cargo.trim() ? cargo : CONFIG_PADRAO.agentes.cargos[a]];
            })) as Record<AgenteId, string>,
            nomes: Object.fromEntries(
              (Object.keys(CONFIG_PADRAO.agentes.nomes) as AgenteId[]).map((a) => {
                const nome = salvo.agentes?.nomes?.[a];
                const antigo = ["Organizador", "Tutor", "Operador"].includes(nome ?? "");
                return [a, nome && !antigo ? nome : CONFIG_PADRAO.agentes.nomes[a]];
              }),
            ) as Record<AgenteId, string>,
          },
          consumo: { ...CONFIG_PADRAO.consumo, ...salvo.consumo },
          ia: { ...CONFIG_PADRAO.ia, ...salvo.ia },
        };
      },
    },
  ),
);

export function nomeDoAgente(id: AgenteId): string {
  return useConfig.getState().agentes.nomes[id];
}

export function useCargos(): Record<AgenteId, string> {
  return useConfig((s) => s.agentes.cargos);
}
