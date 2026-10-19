import type { PickedFile } from '@/data/trip-extras';

/** No navegador o seletor entrega um File/Blob (ou um blob: URL). */
export async function readFileBytes(file: PickedFile): Promise<ArrayBuffer> {
  if (file.webFile) return file.webFile.arrayBuffer();
  return (await fetch(file.uri)).arrayBuffer();
}
