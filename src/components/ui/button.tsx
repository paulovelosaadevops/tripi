import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import { Radius, TouchTarget } from '@/theme/tokens';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'large' | 'medium';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  loading,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors, scheme } = useAppTheme();
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: 'transparent' },
    secondary: {
      bg: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : colors.surface,
      fg: colors.text,
      border: colors.inputBorder,
    },
    danger: {
      bg: scheme === 'dark' ? 'rgba(255,120,110,0.12)' : colors.surface,
      fg: colors.danger,
      border: colors.dangerBorder,
    },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        {
          height: size === 'large' ? 56 : 48,
          borderRadius: size === 'large' ? 18 : Radius.md,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'primary' && scheme === 'dark' && styles.glow,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={20} color={palette.fg} strokeWidth={2.3} />}
          <AppText variant="bodyStrong" weight="extrabold" color={palette.fg} style={{ fontSize: size === 'large' ? 16 : 15 }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'surface' | 'accent' | 'hero';
};

/** Botão redondo de 44 pt (voltar, fechar, buscar…). */
export function IconButton({ icon, label, onPress, variant = 'surface' }: IconButtonProps) {
  const { colors, scheme } = useAppTheme();
  const look = {
    surface: {
      bg: scheme === 'dark' ? 'rgba(255,255,255,0.10)' : colors.surface,
      fg: colors.text,
      border: scheme === 'dark' ? 'rgba(255,255,255,0.18)' : colors.surfaceBorder,
    },
    accent: { bg: colors.accent, fg: colors.onAccent, border: 'transparent' },
    hero: { bg: colors.heroTrack, fg: colors.heroText, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.icon,
        { backgroundColor: look.bg, borderColor: look.border, opacity: pressed ? 0.75 : 1 },
      ]}>
      <Icon name={icon} size={20} color={look.fg} strokeWidth={2.1} />
    </Pressable>
  );
}

type FabProps = { label: string; onPress: () => void; bottom?: number };

/** Botão flutuante "+ Atividade", "+ Gasto"… */
export function FloatingButton({ label, onPress, bottom = 24 }: FabProps) {
  const { colors, scheme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Adicionar ${label.toLowerCase()}`}
      style={({ pressed }) => [
        styles.fab,
        { bottom, backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
        scheme === 'dark' ? styles.glow : styles.fabShadow,
      ]}>
      <Icon name="plus" size={20} color={colors.onAccent} strokeWidth={2.4} />
      <AppText variant="bodyStrong" weight="extrabold" color={colors.onAccent}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glow: {
    shadowColor: '#4BE3A5',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  icon: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: TouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
  },
  fabShadow: {
    shadowColor: '#0B3D2E',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
