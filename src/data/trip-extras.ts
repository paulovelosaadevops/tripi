import { useMutation, useQuery } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { offlineMutation } from '@/data/offline';
import { keys, queryClient, unwrap } from '@/data/query-client';
import { readFileBytes } from '@/lib/read-file';
import { supabase } from '@/lib/supabase';
import type { Contact, DocumentKind, DocumentVisibility, Note, TripDocument } from '@/lib/types';

// ── Contatos de emergência ────────────────────────────────────

export function useContacts(tripId: string) {
  return useQuery({
    queryKey: keys.contacts(tripId),
    queryFn: async () => unwrap<Contact[]>(await supabase.from('contacts').select('*').eq('trip_id', tripId).order('created_at')),
  });
}

export type ContactInput = { name: string; phone: string | null; notes: string | null };

export function useSaveContact(tripId: string) {
  return useMutation({
    mutationFn: async ({ id, ...input }: ContactInput & { id?: string }) =>
      id
        ? unwrap(await supabase.from('contacts').update(input).eq('id', id))
        : unwrap(await supabase.from('contacts').insert({ ...input, trip_id: tripId })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.contacts(tripId) }),
  });
}

export function useDeleteContact(tripId: string) {
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('contacts').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.contacts(tripId) }),
  });
}

// ── Anotações ─────────────────────────────────────────────────

export function useNotes(tripId: string) {
  return useQuery({
    queryKey: keys.notes(tripId),
    queryFn: async () =>
      unwrap<Note[]>(await supabase.from('notes').select('*').eq('trip_id', tripId).order('updated_at', { ascending: false })),
  });
}

type NoteInput = { id?: string; isNew?: boolean; title: string; body: string; tag: string | null };

/** Funciona offline: a anotação aparece na hora e vai para a nuvem quando houver conexão. */
export const useSaveNote = offlineMutation<NoteInput, Note>({
  key: 'note-save',
  prepare: (input) => (input.id ? input : { ...input, id: Crypto.randomUUID(), isNew: true }),
  send: async ({ tripId, id, isNew, ...input }) =>
    isNew
      ? unwrap(await supabase.from('notes').insert({ ...input, id, trip_id: tripId }))
      : unwrap(await supabase.from('notes').update(input).eq('id', id!)),
  list: keys.notes,
  apply: (rows, { tripId, id, isNew, ...input }) => {
    const now = new Date().toISOString();
    if (isNew) return [{ ...input, id: id!, trip_id: tripId, created_by: '', created_at: now, updated_at: now }, ...rows];
    return [...rows.map((row) => (row.id === id ? { ...row, ...input, updated_at: now } : row))].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
  },
});

export const useDeleteNote = offlineMutation<{ id: string }, Note>({
  key: 'note-delete',
  send: async ({ id }) => unwrap(await supabase.from('notes').delete().eq('id', id)),
  list: keys.notes,
  apply: (rows, { id }) => rows.filter((row) => row.id !== id),
});

// ── Documentos ────────────────────────────────────────────────

const BUCKET = 'documents';

export function useDocuments(tripId: string) {
  return useQuery({
    queryKey: keys.documents(tripId),
    queryFn: async () =>
      unwrap<TripDocument[]>(await supabase.from('documents').select('*').eq('trip_id', tripId).order('created_at', { ascending: false })),
  });
}

export type PickedFile = { uri: string; name: string; mimeType: string | null; webFile?: Blob };

export type NewDocument = {
  file: PickedFile;
  name: string;
  kind: DocumentKind;
  visibility: DocumentVisibility;
  expires_on: string | null;
};

/** Envia o arquivo para documents/<viagem>/<arquivo> e registra o documento. */
export function useUploadDocument(tripId: string) {
  return useMutation({
    mutationFn: async ({ file, ...input }: NewDocument) => {
      const safeName = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80) || 'arquivo';
      const path = `${tripId}/${Date.now()}-${safeName}`;
      const bytes = await readFileBytes(file);
      const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.mimeType ?? 'application/octet-stream',
      });
      if (upload.error) throw new Error(upload.error.message);
      const result = await supabase
        .from('documents')
        .insert({ ...input, trip_id: tripId, storage_path: path, mime_type: file.mimeType })
        .select('*')
        .single();
      if (result.error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw new Error(result.error.message);
      }
      return result.data as TripDocument;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.documents(tripId) }),
  });
}

export function useDeleteDocument(tripId: string) {
  return useMutation({
    mutationFn: async (doc: TripDocument) => {
      unwrap(await supabase.from('documents').delete().eq('id', doc.id));
      await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.documents(tripId) }),
  });
}

/** Link temporário (1 hora) para abrir ou baixar o arquivo. */
export async function documentUrl(doc: TripDocument): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 3600);
  if (error || !data) throw new Error(error?.message ?? 'Sem link');
  return data.signedUrl;
}

// ── Recibos ───────────────────────────────────────────────────

/** Envia a foto do recibo para documents/<viagem>/recibos/ e devolve o caminho (precisa de internet). */
export async function uploadReceipt(tripId: string, file: PickedFile): Promise<string> {
  const path = `${tripId}/recibos/${Date.now()}-${Crypto.randomUUID().slice(0, 8)}.jpg`;
  const bytes = await readFileBytes(file);
  const upload = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.mimeType ?? 'image/jpeg' });
  if (upload.error) throw new Error(upload.error.message);
  return path;
}

/** Link temporário (1 hora) para ver a foto do recibo. */
export async function receiptUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? 'Sem link');
  return data.signedUrl;
}
