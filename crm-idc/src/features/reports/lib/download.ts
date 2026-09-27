/**
 * Download de arquivos gerados no navegador (Blob + link temporário). Só no cliente.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Texto (ex.: CSV já com BOM) como arquivo. */
export function saveTextFile(content: string, fileName: string, mimeType = "text/csv;charset=utf-8"): void {
  saveBlob(new Blob([content], { type: mimeType }), fileName);
}
