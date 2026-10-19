import { StyleSheet, Switch, View } from 'react-native';

import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type SwitchRowProps = { title: string; subtitle?: string; value: boolean; onChange: (value: boolean) => void };

export function SwitchRow({ title, subtitle, value, onChange }: SwitchRowProps) {
  const { colors } = useAppTheme();
  return (
    <Surface radius={16} style={styles.row}>
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ true: colors.accent, false: colors.track }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.track}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 14, paddingVertical: 8 },
  text: { flex: 1 },
});
