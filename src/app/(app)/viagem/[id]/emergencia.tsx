import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ListRow, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useContacts } from '@/data/trip-extras';
import { useTrip } from '@/data/trips';
import { usePlace } from '@/data/weather';
import { emergencyNumbers } from '@/lib/emergency';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

const call = (number: string) => Linking.openURL(`tel:${number.replace(/[^\d+]/g, '')}`);

/** Telefones de emergência do país do destino (guardados no app, funcionam offline) e os contatos da viagem. */
export default function EmergencyScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const contacts = useContacts(id);
  const { colors } = useAppTheme();
  const destination = trip.data?.destinations[0]?.trim();
  const place = usePlace(destination || undefined);
  const numbers = emergencyNumbers(place.data?.countryCode);

  return (
    <Screen header={<ScreenHeader title="Emergência" />}>
      <View style={styles.section}>
        <SectionTitle>{place.data ? `Em ${place.data.country}` : 'No destino'}</SectionTitle>
        {numbers ? (
          numbers.map((n) => (
            <Pressable
              key={n.label + n.number}
              onPress={() => call(n.number)}
              accessibilityRole="button"
              accessibilityLabel={`Ligar para ${n.label}: ${n.number}`}>
              {({ pressed }) => (
                <Surface style={[styles.number, pressed && { opacity: 0.8 }]}>
                  <View style={[styles.badge, { backgroundColor: colors.orange.bg }]}>
                    <Icon name="phone" size={22} color={colors.orange.fg} />
                  </View>
                  <AppText variant="bodyStrong" style={styles.flex}>
                    {n.label}
                  </AppText>
                  <AppText variant="title" color={colors.orange.fg}>
                    {n.number}
                  </AppText>
                </Surface>
              )}
            </Pressable>
          ))
        ) : (
          <Surface style={styles.note}>
            <AppText variant="bodyStrong">
              {place.isPending && destination ? 'Identificando o país do destino…' : 'Número geral de emergência: 112'}
            </AppText>
            <AppText variant="small" tone="muted">
              O 112 funciona em celulares na maior parte do mundo (inclusive toda a Europa) e costuma redirecionar para o serviço local.
            </AppText>
          </Surface>
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle>Contatos da viagem</SectionTitle>
        {contacts.data && contacts.data.length > 0 ? (
          <Surface>
            {contacts.data.map((c, i) => (
              <ListRow
                key={c.id}
                icon="phone"
                title={c.name}
                subtitle={[c.phone, c.notes].filter(Boolean).join(' · ') || undefined}
                onPress={c.phone ? () => call(c.phone!) : undefined}
                isLast={i === contacts.data.length - 1}
              />
            ))}
          </Surface>
        ) : (
          <AppText variant="small" tone="muted">
            Nenhum contato ainda. Vale guardar o seguro viagem, a hospedagem, o consulado do Brasil na cidade e alguém em casa.
          </AppText>
        )}
        <Button
          label="Gerenciar contatos"
          variant="secondary"
          size="medium"
          icon="plus"
          onPress={() => router.push({ pathname: '/viagem/[id]/contatos', params: { id } })}
        />
      </View>

      <Surface style={styles.note}>
        <AppText variant="bodyStrong">Brasileiro no exterior?</AppText>
        <AppText variant="small" tone="muted">
          O Portal Consular do Itamaraty lista consulados e o plantão consular para emergências. Salve o telefone do consulado da
          cidade nos contatos antes de viajar.
        </AppText>
        <Button
          label="Abrir Portal Consular"
          variant="secondary"
          size="medium"
          onPress={() => Linking.openURL('https://www.gov.br/mre/pt-br/assuntos/portal-consular')}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: 8 },
  number: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  note: { padding: 16, gap: 10 },
});
