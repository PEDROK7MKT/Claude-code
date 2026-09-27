/**
 * Captura dos gráficos Recharts da página como PNG para o PDF (só no navegador):
 * SVG → XMLSerializer → <img> → <canvas> → data URL. Os gráficos usam cores hex
 * (não var(--…)), então o SVG isolado mantém a aparência da tela; mesmo assim,
 * cores herdadas de CSS são resolvidas e copiadas para os atributos.
 */
import { CHART_DATA_ATTRIBUTE, type ReportChartId } from "./charts";
import type { PdfChartImage } from "./pdf";

const FONT_STACK = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** SVG principal do gráfico dentro do contêiner marcado com data-report-chart. */
export function findChartSvg(root: ParentNode, id: ReportChartId): SVGSVGElement | null {
  const container = root.querySelector(`[${CHART_DATA_ATTRIBUTE}="${id}"]`);
  if (!container) return null;
  return (
    container.querySelector<SVGSVGElement>(".recharts-wrapper > svg") ??
    container.querySelector<SVGSVGElement>("svg.recharts-surface")
  );
}

const PAINT_ATTRIBUTES = ["fill", "stroke", "stop-color"] as const;

function needsResolution(value: string | null): boolean {
  return value !== null && (value.includes("var(") || value === "currentColor");
}

/** Cópia autônoma do SVG: dimensões explícitas, fonte e cores resolvidas, sem cursor/tooltip ativos. */
function standaloneClone(svg: SVGSVGElement, width: number, height: number): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  clone.setAttribute("style", `font-family: ${FONT_STACK}; font-size: 12px; background: #ffffff;`);

  const originals = svg.querySelectorAll<SVGElement>("*");
  const copies = clone.querySelectorAll<SVGElement>("*");
  originals.forEach((original, index) => {
    const copy = copies[index];
    if (!copy) return;
    const computed = window.getComputedStyle(original);
    for (const attribute of PAINT_ATTRIBUTES) {
      if (needsResolution(copy.getAttribute(attribute))) {
        copy.setAttribute(attribute, computed.getPropertyValue(attribute));
      }
    }
    // textos: a cor/tamanho finais podem vir de classes CSS da página
    if (original.tagName.toLowerCase() === "text" || original.tagName.toLowerCase() === "tspan") {
      copy.setAttribute("fill", computed.fill);
      copy.setAttribute("font-size", computed.fontSize);
      copy.setAttribute("font-weight", computed.fontWeight);
    }
  });

  // elementos de interação (hover) não entram na imagem
  clone
    .querySelectorAll(".recharts-tooltip-cursor, .recharts-active-dot, .recharts-tooltip-wrapper")
    .forEach((node) => node.remove());
  return clone;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível converter o gráfico em imagem."));
    image.src = src;
  });
}

/** Converte o SVG em PNG (fundo branco) com `scale`× a resolução da tela. */
export async function svgToPng(svg: SVGSVGElement, scale = 3): Promise<PdfChartImage> {
  const rect = svg.getBoundingClientRect();
  const width = Math.round(rect.width || svg.width.baseVal.value);
  const height = Math.round(rect.height || svg.height.baseVal.value);
  if (!width || !height) throw new Error("Gráfico sem dimensões visíveis para exportar.");

  const markup = new XMLSerializer().serializeToString(standaloneClone(svg, width, height));
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Seu navegador não permitiu gerar as imagens dos gráficos.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/png"), width, height };
}

/**
 * Captura os gráficos disponíveis, na ordem pedida. Gráficos ausentes da página
 * (estado vazio) ou que falharem são omitidos — o PDF sai sem eles.
 */
export async function captureReportCharts(
  root: ParentNode,
  ids: readonly ReportChartId[],
): Promise<Map<ReportChartId, PdfChartImage>> {
  const images = new Map<ReportChartId, PdfChartImage>();
  for (const id of ids) {
    const svg = findChartSvg(root, id);
    if (!svg) continue;
    try {
      images.set(id, await svgToPng(svg));
    } catch {
      // segue sem este gráfico
    }
  }
  return images;
}
