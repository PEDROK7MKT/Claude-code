/**
 * Baixa um texto como arquivo (Blob + link temporário). Adiciona BOM UTF-8 para
 * o Excel abrir acentos corretamente. Só no navegador.
 */
export function downloadTextFile(filename: string, content: string, mimeType = "text/csv;charset=utf-8"): void {
  const blob = new Blob([String.fromCharCode(0xfeff), content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
