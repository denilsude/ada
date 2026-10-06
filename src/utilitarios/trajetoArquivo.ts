interface RetanguloVisual {
  left: number;
  top: number;
  width: number;
  height: number;
}

function retanguloValido(retangulo: RetanguloVisual) {
  return [retangulo.left, retangulo.top, retangulo.width, retangulo.height].every(Number.isFinite) && retangulo.width > 0 && retangulo.height > 0;
}

export function calcularTrajetoArquivo(zona: RetanguloVisual, personagem: RetanguloVisual, ponto: { x: number; y: number }, escala: number) {
  if (!retanguloValido(zona) || !retanguloValido(personagem) || ![ponto.x, ponto.y, escala].every(Number.isFinite) || escala <= 0) return null;
  if (ponto.x < zona.left || ponto.x > zona.left + zona.width || ponto.y < zona.top || ponto.y > zona.top + zona.height) return null;
  return {
    origem: { x: (ponto.x - zona.left) / escala, y: (ponto.y - zona.top) / escala },
    destino: { x: (personagem.left - zona.left + personagem.width / 2) / escala, y: (personagem.top - zona.top + personagem.height * 0.55) / escala },
  };
}
