import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PillButton, useCopy } from '@/components/agenda-list';
import { SkeletonBlock } from '@/components/skeleton';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ListRow, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useReservations } from '@/data/trip-content';
import { useDocuments } from '@/data/trip-extras';
import { formatWeekdayDayMonth, toISODate } from '@/lib/format';
import { DocumentKindLabels, ReservationKindLabels, reservationTint } from '@/lib/labels';
import { openDirections } from '@/lib/maps';
import type { Reservation } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';

/**
 * Carteira de viagem: códigos de reserva, cartões de embarque e vouchers à mão, com copiar e "Como chegar".
 * Vem do cache salvo no aparelho, então abre offline.
 */
export default function WalletScreen() {
  const id = useTripId();
  const reservations = useReservations(id);
  const documents = useDocuments(id);
  const { colors } = useAppTheme();
  const { copied, copy } = useCopy();
  const today = toISODate(new Date());

  // Próximas primeiro; as que já passaram vão para o fim.
  const list = [...(reservations.data ?? [])].sort((a, b) => {
    const pastA = (a.ends_at ?? a.starts_at ?? '9999') < today;
    const pastB = (b.ends_at ?? b.starts_at ?? '9999') < today;
    if (pastA !== pastB) return pastA ? 1 : -1;
    return (a.starts_at ?? '9999').localeCompare(b.starts_at ?? '9999');
  });
  const isPast = (r: Reservation) => (r.ends_at ?? r.starts_at ?? '9999').slice(0, 10) < today;
  const docs = (documents.data ?? []).filter((d) => d.kind === 'voucher' || d.kind === 'passaporte' || d.kind === 'seguro' || d.kind === 'visto');

  return (
    <Screen header={<ScreenHeader title="Carteira de viagem" />}>
      <AppText variant="small" tone="muted">
        Códigos e comprovantes à mão, mesmo sem internet. Toque no código para copiar.
      </AppText>

      {(reservations.isPending || documents.isPending) && <SkeletonBlock height={180} radius={22} />}

      {reservations.data && reservations.data.length === 0 && docs.length === 0 && (
        <EmptyState
          title="Carteira vazia"
          message="Adicione reservas (com o código) e documentos como passaporte, seguro e vouchers para tê-los aqui."
        />
      )}

      {list.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Reservas</SectionTitle>
          {list.map((r) => {
            const tint = reservationTint(colors, r.kind);
            return (
              <Surface key={r.id} style={[styles.card, isPast(r) && styles.past]}>
                <Pressable
                  onPress={() => router.push({ pathname: '/viagem/[id]/reserva-nova', params: { id, editId: r.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${ReservationKindLabels[r.kind]}: ${r.title}`}
                  style={styles.cardTop}>
                  <View style={[styles.icon, { backgroundColor: tint.bg }]}>
                    <Icon name={r.kind === 'voo' ? 'plane' : 'ticket'} size={20} color={tint.fg} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" weight="extrabold">
                      {r.title}
                    </AppText>
                    <AppText variant="small" tone="muted">
                      {[
                        ReservationKindLabels[r.kind],
                        r.starts_at ? formatWeekdayDayMonth(r.starts_at.slice(0, 10)) : null,
                        r.starts_at && r.starts_at.slice(11, 16) !== '00:00' ? r.starts_at.slice(11, 16) : null,
                        isPast(r) ? 'já passou' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </AppText>
                  </View>
                </Pressable>

                {r.code ? (
                  <Pressable
                    onPress={() => copy(r.code!)}
                    accessibilityRole="button"
                    accessibilityLabel={`Código ${r.code.split('').join(' ')}. Toque para copiar`}
                    style={({ pressed }) => [styles.code, { backgroundColor: colors.track }, pressed && { opacity: 0.7 }]}>
                    <AppText style={styles.codeText} selectable>
                      {r.code}
                    </AppText>
                    <View style={styles.copy}>
                      <Icon name={copied === r.code ? 'check' : 'copy'} size={18} color={colors.accent} />
                      <AppText variant="caption" weight="bold" tone="accent">
                        {copied === r.code ? 'Copiado!' : 'Copiar'}
                      </AppText>
                    </View>
                  </Pressable>
                ) : (
                  <AppText variant="caption" tone="muted">
                    Sem código. Toque na reserva para adicionar.
                  </AppText>
                )}

                {r.place && (
                  <View style={styles.actions}>
                    <PillButton icon="navigate" label="Como chegar" onPress={() => openDirections(r.place!)} accessibilityLabel={`Como chegar a ${r.place}`} />
                  </View>
                )}
              </Surface>
            );
          })}
        </View>
      )}

      {docs.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Documentos</SectionTitle>
          <Surface>
            {docs.map((d, i) => (
              <ListRow
                key={d.id}
                icon="document"
                title={d.name}
                subtitle={DocumentKindLabels[d.kind]}
                onPress={() => router.push({ pathname: '/viagem/[id]/documento/[docId]', params: { id, docId: d.id } })}
                isLast={i === docs.length - 1}
              />
            ))}
          </Surface>
          <AppText variant="caption" tone="muted">
            Para abrir um documento sem internet, toque nele e use &quot;Guardar no aparelho&quot; (no celular).
          </AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: 8 },
  card: { padding: 14, gap: 12 },
  past: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  code: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, minHeight: 52 },
  codeText: { fontFamily: FontFamily.extrabold, fontSize: 24, letterSpacing: 3 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
