import { Suspense, useEffect, useRef, useState } from "react";
import { useInterface } from "../../estado/interface";
import { useConfig } from "../../estado/configuracoes";
import { BarraLateral } from "./BarraLateral";
import { PAGINA_ROTA } from "./rotas";
import { T } from "../../textos/textos";
import { AvisosRodape } from "../../componentes/basicos";
import { rotaLigada } from "../../utilitarios/funcoes";

export function JanelaSistema() {
  const rotaPedida = useInterface((s) => s.rota);
  const desligadas = useConfig((s) => s.funcoesDesligadas);
  const rota = rotaLigada(rotaPedida, desligadas) ? rotaPedida : "inicio";
  const z = useInterface((s) => s.zSistema);
  const focar = useInterface((s) => s.focarSistema);
  const recolhidaManual = useConfig((s) => s.barraRecolhida);
  const conteudo = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(1280);

  useEffect(() => {
    const el = conteudo.current?.parentElement;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => setLargura(e.contentRect.width));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    conteudo.current?.scrollTo({ top: 0 });
  }, [rota]);

  const Pagina = PAGINA_ROTA[rota];
  const recolhida = recolhidaManual || largura < 1100;

  return (
    <div className="sistema-aplicacao" aria-label={T.app.nome} style={{ zIndex: z }} onPointerDownCapture={focar}>
      <div className="sistema">
        <BarraLateral recolhida={recolhida} />
        <main className="sistema-conteudo" ref={conteudo}>
          <Suspense fallback={<div className="carregando-pagina" aria-busy="true" />}>
            <div className="pagina" key={rota}>
              <Pagina />
            </div>
          </Suspense>
        </main>
      </div>
      <AvisosRodape />
    </div>
  );
}
