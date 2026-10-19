import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ChipGroup } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { ErrorView, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { convert, useHomeCurrency, useRates } from '@/data/exchange';
import { useTrip } from '@/data/trips';
import { formatBrazilianDate, formatMoney, parseMoney } from '@/lib/format';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';

const quickAmounts = [1, 5, 10, 20, 50, 100];

/** Conversor entre a moeda da viagem e a moeda de casa, com a cotação do dia (BCE, gratuita). */
export default function ExchangeScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const home = useHomeCurrency();
  const { colors } = useAppTheme();
  const local = trip.data?.local_currency ?? 'EUR';
  const rates = useRates(local);
  const [from, setFrom] = useState<string | null>(null);
  const [amount, setAmount] = useState('10');

  const source = from ?? local;
  const target = source === local ? home : local;
  const value = parseMoney(amount) ?? 0;
  const result = convert(value, source, target, rates.data);
  const others = [...new Set([local, home, 'BRL', 'USD', 'EUR', 'GBP'])].map((c) => ({ value: c, label: c }));

  return (
    <Screen header={<ScreenHeader title="Câmbio" />}>
      {rates.isError && <ErrorView message="Não conseguimos buscar a cotação. Verifique a internet." onRetry={() => rates.refetch()} />}

      <Surface variant="hero" radius={26} style={styles.hero}>
        <AppText variant="small" weight="bold" tone="heroMuted">
          Valor em {source}
        </AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          accessibilityLabel={`Valor em ${source}`}
          selectTextOnFocus
          style={[styles.input, { color: colors.heroText }]}
        />
        <Pressable
          onPress={() => setFrom(target)}
          accessibilityRole="button"
          accessibilityLabel="Inverter moedas"
          style={[styles.swap, { backgroundColor: colors.heroTrack }]}>
          <Icon name="swap" size={18} color={colors.heroText} />
          <AppText variant="small" weight="bold" tone="hero">
            {source} → {target}
          </AppText>
        </Pressable>
        <AppText variant="display" tone="hero" style={styles.result} accessibilityLiveRegion="polite">
          {result != null ? formatMoney(result, target, { cents: true }) : rates.isPending ? '…' : 'Sem cotação'}
        </AppText>
        {rates.data && (
          <AppText variant="caption" tone="heroMuted">
            Cotação de {formatBrazilianDate(rates.data.date)} · Banco Central Europeu
          </AppText>
        )}
      </Surface>

      <ChipGroup label="Converter de" options={others} value={source} onChange={setFrom} scroll />

      {rates.data && source !== target && (
        <View style={styles.section}>
          <SectionTitle>Tabela rápida</SectionTitle>
          <Surface>
            {quickAmounts.map((n, i) => {
              const converted = convert(n, source, target, rates.data);
              return (
                <View
                  key={n}
                  style={[styles.row, i < quickAmounts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
                  <AppText variant="bodyStrong">{formatMoney(n, source)}</AppText>
                  <AppText variant="bodyStrong" weight="extrabold">
                    {converted != null ? formatMoney(converted, target, { cents: true }) : '—'}
                  </AppText>
                </View>
              );
            })}
          </Surface>
        </View>
      )}

      <AppText variant="caption" tone="muted">
        A cotação oficial muda uma vez por dia útil. No cartão ou na casa de câmbio o valor costuma ser um pouco maior (IOF e taxas).
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, gap: 8, alignItems: 'center' },
  input: {
    fontFamily: FontFamily.extrabold,
    fontSize: 40,
    minWidth: 140,
    textAlign: 'center',
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, minHeight: 36 },
  result: { fontSize: 34, lineHeight: 42 },
  section: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
});
