import { useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useActivities, useChecklist, useExpenses, useReservations } from '@/data/trip-content';
import { useContacts } from '@/data/trip-extras';
import { useTrip, useTripMembers } from '@/data/trips';
import { buildTripHtml, type ExportSections } from '@/lib/export-html';
import { sharePdf } from '@/lib/share-pdf';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

const sectionLabels: { key: keyof ExportSections; label: string }[] = [
  { key: 'itinerary', label: 'Roteiro dia a dia' },
  { key: 'reservations', label: 'Reservas e códigos' },
  { key: 'expenses', label: 'Gastos' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'contacts', label: 'Contatos de emergência' },
];

export default function ExportScreen() {
  const id = useTripId();
  const { colors } = useAppTheme();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const activities = useActivities(id);
  const reservations = useReservations(id);
  const expenses = useExpenses(id);
  const checklist = useChecklist(id);
  const contacts = useContacts(id);
  const [sections, setSections] = useState<ExportSections>({
    itinerary: true,
    reservations: true,
    expenses: false,
    checklist: false,
    contacts: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(trip.data && activities.data && reservations.data && expenses.data && checklist.data && contacts.data);
  const chosen = sectionLabels.filter((s) => sections[s.key]).length;

  async function generate() {
    if (!trip.data) return;
    setError(null);
    setBusy(true);
    try {
      const html = buildTripHtml(
        {
          trip: trip.data,
          travelers: members.data?.length ?? 1,
          activities: activities.data ?? [],
          reservations: reservations.data ?? [],
          expenses: expenses.data ?? [],
          checklist: checklist.data ?? [],
          contacts: contacts.data ?? [],
        },
        sections,
      );
      await sharePdf(html, `${trip.data.name} · Tripi`);
    } catch {
      setError(Platform.OS === 'web' ? 'Permita janelas pop-up para este site e tente de novo.' : 'Não foi possível gerar o PDF.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      header={<ScreenHeader title="Exportar roteiro" />}
      footer={
        <>
          {error && (
            <AppText variant="small" tone="danger">
              {error}
            </AppText>
          )}
          <Button
            label={Platform.OS === 'web' ? 'Abrir para imprimir' : 'Gerar PDF e compartilhar'}
            icon="upload"
            loading={busy || !ready}
            disabled={chosen === 0}
            onPress={generate}
          />
        </>
      }>
      <AppText variant="small" tone="muted">
        Um PDF para guardar no celular, imprimir ou mandar para quem vai com você.
      </AppText>
      <SectionTitle>Incluir</SectionTitle>
      <Surface>
        {sectionLabels.map((section, index) => (
          <View
            key={section.key}
            style={[styles.row, index < sectionLabels.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
            <AppText variant="bodyStrong" style={styles.flex}>
              {section.label}
            </AppText>
            <Switch
              value={sections[section.key]}
              onValueChange={(value) => setSections({ ...sections, [section.key]: value })}
              accessibilityLabel={section.label}
              trackColor={{ true: colors.accent, false: colors.track }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.track}
            />
          </View>
        ))}
      </Surface>
      <AppText variant="caption" tone="muted">
        {chosen === 0 ? 'Escolha pelo menos uma seção.' : `${chosen} de ${sectionLabels.length} seções no PDF.`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 16 },
});
