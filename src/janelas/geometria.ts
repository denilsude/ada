import { useInterface, type Geometria } from "../estado/interface";

export function areaUtil() {
  return { w: window.innerWidth, h: window.innerHeight };
}

export function retangulosAbertos(): Geometria[] {
  const s = useInterface.getState();
  const area = areaUtil();
  const lista: Geometria[] = [];
  if (s.sistemaAberto && !s.sistemaMinimizado) lista.push(s.sistemaMaximizado ? { x: 0, y: 0, w: area.w, h: area.h } : s.geometria);
  for (const j of s.janelasConexao) if (!j.minimizada) lista.push(j.maximizada ? { x: 0, y: 0, w: area.w, h: area.h } : j.geometria);
  return lista.filter((g) => g.w > 0);
}

export function sobrepoe(a: Geometria, b: Geometria): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function alguemCobre(alvo: Geometria): boolean {
  return retangulosAbertos().some((r) => sobrepoe(r, alvo));
}
