import { documentUrl } from '@/data/trip-extras';
import type { TripDocument } from '@/lib/types';

/** No navegador não há cópia offline: os documentos abrem direto da nuvem. */
export const canKeepOffline = false;

export function isOffline(_doc: TripDocument): boolean {
  return false;
}

export async function keepOffline(_doc: TripDocument) {}

export function removeOffline(_doc: TripDocument) {}

export async function openDocument(doc: TripDocument) {
  globalThis.open?.(await documentUrl(doc), '_blank');
}
