import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/** Gera o PDF e abre o compartilhamento do sistema (salvar em Arquivos, mandar por mensagem…). */
export async function sharePdf(html: string, title: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
  } else {
    await Print.printAsync({ uri });
  }
}
