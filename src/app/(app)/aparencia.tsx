import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useAppTheme, type ThemePreference } from '@/theme/theme-provider';

const options: { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'auto', label: 'Automático', hint: 'Segue o modo do celular' },
  { value: 'light', label: 'Claro', hint: 'Sempre claro' },
  { value: 'dark', label: 'Escuro', hint: 'Sempre escuro, com Liquid Glass' },
];

export default function AppearanceScreen() {
  const { preference, setPreference, scheme, colors } = useAppTheme();
  const caption =
    preference === 'auto'
      ? `Automático · agora ${scheme === 'dark' ? 'escuro' : 'claro'}, igual ao celular`
      : 'Ignora o modo do celular';

  return (
    <Screen header={<ScreenHeader title="Aparência" />}>
      <Surface variant="hero" radius={24} style={styles.preview}>
        <View style={styles.previewTop}>
          <View style={styles.flex}>
            <AppText variant="heading" tone="hero">
              Sua próxima viagem
            </AppText>
            <AppText variant="small" tone="heroMuted">
              Prévia do tema
            </AppText>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.apricot }]}>
            <AppText variant="caption" weight="extrabold" color={colors.onApricot}>
              25 dias
            </AppText>
          </View>
        </View>
        <ProgressBar value={0.4} tone="hero" />
      </Surface>
      <AppText variant="small" weight="bold" tone="muted" style={styles.center}>
        {caption}
      </AppText>

      <SectionTitle>Tema</SectionTitle>
      <Surface accessibilityRole="radiogroup">
        {options.map((option, index) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${option.label}. ${option.hint}`}
              style={[styles.option, index < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
              <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.inputBorder }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" weight="extrabold">
                  {option.label}
                </AppText>
                <AppText variant="small" tone="muted">
                  {option.hint}
                </AppText>
              </View>
              <Swatch kind={option.value} />
            </Pressable>
          );
        })}
      </Surface>
    </Screen>
  );
}

function Swatch({ kind }: { kind: ThemePreference }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.swatch, { borderColor: colors.inputBorder }]} accessibilityElementsHidden>
      {kind !== 'dark' && <View style={[styles.swatchHalf, { backgroundColor: '#F2F4F3' }]} />}
      {kind !== 'light' && <View style={[styles.swatchHalf, { backgroundColor: '#06100D' }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  preview: { padding: 18, gap: 16 },
  previewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 66, paddingHorizontal: 16 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  swatch: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  swatchHalf: { flex: 1 },
});
