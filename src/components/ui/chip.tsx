import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import { Radius } from '@/theme/tokens';

type ChipGroupProps<T extends string> = {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Rola na horizontal em vez de quebrar linha (filtros). */
  scroll?: boolean;
};

export function ChipGroup<T extends string>({ label, options, value, onChange, scroll }: ChipGroupProps<T>) {
  const chips = options.map((option) => (
    <Chip key={option.value} label={option.label} selected={option.value === value} onPress={() => onChange(option.value)} />
  ));
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {label && (
        <AppText variant="small" weight="bold" tone="label">
          {label}
        </AppText>
      )}
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {chips}
        </ScrollView>
      ) : (
        <View style={[styles.row, styles.wrap]}>{chips}</View>
      )}
    </View>
  );
}

type ChipProps = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors, scheme } = useAppTheme();
  const off = {
    bg: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : colors.surface,
    border: scheme === 'dark' ? 'rgba(255,255,255,0.15)' : colors.inputBorder,
  };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      aria-checked={selected}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: colors.accent, borderColor: colors.accent }
          : { backgroundColor: off.bg, borderColor: off.border },
        pressed && { opacity: 0.8 },
      ]}>
      <AppText variant="small" weight="bold" color={selected ? colors.onAccent : colors.text} style={{ fontSize: 14 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Etiqueta colorida pequena ("Passeio", "Voo"…). */
export function Tag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <AppText variant="caption" weight="extrabold" color={fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
});
