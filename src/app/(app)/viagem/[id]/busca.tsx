import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/ui/field';
import type { IconName } from '@/components/ui/icon';
import { EmptyState, ListRow, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useActivities, useChecklist, useExpenses, useReservations } from '@/data/trip-content';
import { useContacts, useDocuments, useNotes } from '@/data/trip-extras';
import { formatDayMonth, formatMoney } from '@/lib/format';
import { ActivityCategoryLabels, DocumentKindLabels, ExpenseCategoryLabels, ReservationKindLabels } from '@/lib/labels';
import { useTripId } from '@/providers/trip-id';

type Hit = { key: string; title: string; subtitle?: string; href: Href };
type Group = { title: string; icon: IconName; hits: Hit[] };

/** "Belém" e "belem" casam: minúsculas e sem acento. */
const normalize = (text: string | null | undefined) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const MAX_PER_GROUP = 8;

/** Busca em tudo o que já está carregado da viagem (funciona sem ir ao servidor). */
export default function SearchScreen() {
  const id = useTripId();
  const activities = useActivities(id);
  const reservations = useReservations(id);
  const expenses = useExpenses(id);
  const notes = useNotes(id);
  const contacts = useContacts(id);
  const documents = useDocuments(id);
  const checklist = useChecklist(id);
  const [query, setQuery] = useState('');

  const q = normalize(query.trim());
  const matches = (...fields: (string | null | undefined)[]) => fields.some((f) => normalize(f).includes(q));

  const groups: Group[] = q.length < 2
    ? []
    : [
        {
          title: 'Roteiro',
          icon: 'calendar' as IconName,
          hits: (activities.data ?? [])
            .filter((a) => matches(a.title, a.place, a.notes))
            .map((a) => ({
              key: a.id,
              title: a.title,
              subtitle: [formatDayMonth(a.day), ActivityCategoryLabels[a.category], a.place].filter(Boolean).join(' · '),
              href: { pathname: '/viagem/[id]/atividade-nova', params: { id, editId: a.id } } as Href,
            })),
        },
        {
          title: 'Reservas',
          icon: 'ticket' as IconName,
          hits: (reservations.data ?? [])
            .filter((r) => matches(r.title, r.code, r.place))
            .map((r) => ({
              key: r.id,
              title: r.title,
              subtitle: [ReservationKindLabels[r.kind], r.code, r.place].filter(Boolean).join(' · '),
              href: { pathname: '/viagem/[id]/reserva-nova', params: { id, editId: r.id } } as Href,
            })),
        },
        {
          title: 'Gastos',
          icon: 'wallet' as IconName,
          hits: (expenses.data ?? [])
            .filter((e) => matches(e.description, ExpenseCategoryLabels[e.category]))
            .map((e) => ({
              key: e.id,
              title: e.description,
              subtitle: `${formatMoney(Number(e.amount), e.currency)} · ${formatDayMonth(e.spent_on)}`,
              href: { pathname: '/viagem/[id]/gasto-novo', params: { id, editId: e.id } } as Href,
            })),
        },
        {
          title: 'Anotações',
          icon: 'note' as IconName,
          hits: (notes.data ?? [])
            .filter((n) => matches(n.title, n.body, n.tag))
            .map((n) => ({
              key: n.id,
              title: n.title,
              subtitle: n.body.slice(0, 80),
              href: { pathname: '/viagem/[id]/anotacao', params: { id, noteId: n.id } } as Href,
            })),
        },
        {
          title: 'Contatos',
          icon: 'phone' as IconName,
          hits: (contacts.data ?? [])
            .filter((c) => matches(c.name, c.phone, c.notes))
            .map((c) => ({
              key: c.id,
              title: c.name,
              subtitle: [c.phone, c.notes].filter(Boolean).join(' · '),
              href: { pathname: '/viagem/[id]/contatos', params: { id } } as Href,
            })),
        },
        {
          title: 'Documentos',
          icon: 'document' as IconName,
          hits: (documents.data ?? [])
            .filter((d) => matches(d.name, DocumentKindLabels[d.kind]))
            .map((d) => ({
              key: d.id,
              title: d.name,
              subtitle: DocumentKindLabels[d.kind],
              href: { pathname: '/viagem/[id]/documento/[docId]', params: { id, docId: d.id } } as Href,
            })),
        },
        {
          title: 'Checklist',
          icon: 'checklist' as IconName,
          hits: (checklist.data ?? [])
            .filter((c) => matches(c.label, c.group_name))
            .map((c) => ({
              key: c.id,
              title: c.label,
              subtitle: `${c.group_name}${c.done ? ' · feito' : ''}`,
              href: { pathname: '/viagem/[id]/checklist', params: { id } } as Href,
            })),
        },
      ].filter((g) => g.hits.length > 0);

  const total = groups.reduce((sum, g) => sum + g.hits.length, 0);

  return (
    <Screen header={<ScreenHeader title="Buscar na viagem" />}>
      <TextField
        label="O que você procura?"
        value={query}
        onChangeText={setQuery}
        placeholder="Ex.: código da reserva, restaurante, seguro…"
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {q.length >= 2 && (
        <AppText variant="small" tone="muted" accessibilityLiveRegion="polite">
          {total === 0 ? 'Nada encontrado.' : total === 1 ? '1 resultado' : `${total} resultados`}
        </AppText>
      )}

      {q.length < 2 && (
        <EmptyState title="Busque em toda a viagem" message="Roteiro, reservas, gastos, anotações, contatos, documentos e checklist." />
      )}

      {groups.map((g) => (
        <View key={g.title} style={styles.section}>
          <SectionTitle>{g.title}</SectionTitle>
          <Surface>
            {g.hits.slice(0, MAX_PER_GROUP).map((hit, i, list) => (
              <ListRow
                key={hit.key}
                icon={g.icon}
                title={hit.title}
                subtitle={hit.subtitle || undefined}
                onPress={() => router.push(hit.href)}
                isLast={i === list.length - 1}
              />
            ))}
          </Surface>
          {g.hits.length > MAX_PER_GROUP && (
            <AppText variant="caption" tone="muted">
              + {g.hits.length - MAX_PER_GROUP} em {g.title.toLowerCase()}. Refine a busca para ver.
            </AppText>
          )}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
});
