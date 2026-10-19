import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

import { documentUrl } from '@/data/trip-extras';
import type { TripDocument } from '@/lib/types';

/** Cópias locais dos documentos, para abrir sem internet. Ficam em <documentos do app>/tripi-docs. */
const folder = new Directory(Paths.document, 'tripi-docs');

function localFile(doc: TripDocument) {
  const extension = doc.storage_path.includes('.') ? doc.storage_path.slice(doc.storage_path.lastIndexOf('.')) : '';
  return new File(folder, `${doc.id}${extension}`);
}

export const canKeepOffline = true;

export function isOffline(doc: TripDocument): boolean {
  return localFile(doc).exists;
}

export async function keepOffline(doc: TripDocument) {
  folder.create({ idempotent: true, intermediates: true });
  const target = localFile(doc);
  if (target.exists) return;
  await File.downloadFileAsync(await documentUrl(doc), target);
}

export function removeOffline(doc: TripDocument) {
  const target = localFile(doc);
  if (target.exists) target.delete();
}

/** Abre a cópia local (pré-visualização do sistema) ou, sem cópia, o link da nuvem. */
export async function openDocument(doc: TripDocument) {
  const local = localFile(doc);
  if (local.exists && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(local.uri, { mimeType: doc.mime_type ?? undefined, dialogTitle: doc.name });
    return;
  }
  await WebBrowser.openBrowserAsync(await documentUrl(doc));
}
