import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorView, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useDocuments } from '@/data/trip-extras';
import { canKeepOffline, isOffline } from '@/lib/document-cache';
import { daysUntil, formatBrazilianDate } from '@/lib/format';
import { DocumentKindLabels } from '@/lib/labels';
import type { TripDocument } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

export default function DocumentsScreen() {
  const id = useTripId();
  const documents = useDocuments(id);
  const { colors } = useAppTheme();
  const personal = documents.data?.filter((d) => d.visibility === 'pessoal') ?? [];
  const shared = documents.data?.filter((d) => d.visibility === 'viagem') ?? [];

  return (
    <Screen
      header={<ScreenHeader title="Documentos" />}
      footer={<Button label="Adicionar documento" icon="plus" onPress={() => router.push({ pathname: '/viagem/[id]/documento-novo', params: { id } })} />}>
      {canKeepOffline && (
        <View style={[styles.banner, { backgroundColor: colors.green.bg }]}>
          <Icon name="cloud" size={20} color={colors.green.fg} />
          <AppText variant="small" weight="bold" color={colors.green.fg} style={styles.flex}>
            Guarde uma cópia no aparelho para abrir mesmo sem internet.
          </AppText>
        </View>
      )}
      {documents.isPending && <SkeletonBlock height={160} radius={20} />}
      {documents.isError && <ErrorView message="Não conseguimos carregar os documentos." onRetry={() => documents.refetch()} />}
      {documents.data?.length === 0 && (
        <EmptyState title="Nenhum documento ainda" message="Passaporte, seguro, vouchers, vistos: tudo num lugar, com aviso de validade." />
      )}
      {personal.length > 0 && <DocumentGroup title="Só meus" items={personal} tripId={id} />}
      {shared.length > 0 && <DocumentGroup title="Da viagem" items={shared} tripId={id} />}
    </Screen>
  );
}

function DocumentGroup({ title, items, tripId }: { title: string; items: TripDocument[]; tripId: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <SectionTitle>{title}</SectionTitle>
      {items.map((doc) => {
        const days = doc.expires_on ? daysUntil(doc.expires_on) : null;
        const status =
          days == null ? null : days < 0 ? { label: 'Vencido', tint: colors.orange } : days < 180 ? { label: 'Vence logo', tint: colors.orange } : { label: 'Válido', tint: colors.green };
        const offline = isOffline(doc);
        return (
          <Pressable
            key={doc.id}
            onPress={() => router.push({ pathname: '/viagem/[id]/documento/[docId]', params: { id: tripId, docId: doc.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${doc.name}, ${DocumentKindLabels[doc.kind]}`}>
            {({ pressed }) => (
              <Surface style={[styles.row, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: colors.blue.bg }]}>
                  <Icon name="document" size={24} color={colors.blue.fg} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" weight="extrabold" numberOfLines={1}>
                    {doc.name}
                  </AppText>
                  <AppText variant="small" tone="muted" numberOfLines={1}>
                    {[DocumentKindLabels[doc.kind], doc.expires_on ? `validade ${formatBrazilianDate(doc.expires_on)}` : null, offline ? 'no aparelho' : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>
                {status && <Tag label={status.label} bg={status.tint.bg} fg={status.tint.fg} />}
              </Surface>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  group: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
