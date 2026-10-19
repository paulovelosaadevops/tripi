import { File } from 'expo-file-system';

import type { PickedFile } from '@/data/trip-extras';

/** Lê o arquivo escolhido (cópia no cache do app) para enviar à nuvem. */
export async function readFileBytes(file: PickedFile): Promise<ArrayBuffer> {
  return new File(file.uri).arrayBuffer();
}
