/** No navegador: abre o documento numa janela e chama a impressão (dá para "Salvar como PDF"). */
export async function sharePdf(html: string, _title: string) {
  const win = globalThis.open?.('', '_blank');
  if (!win) throw new Error('Janela bloqueada pelo navegador');
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
