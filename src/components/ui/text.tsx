import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily, type FontWeightName, type Palette } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'overline';
type Tone = 'default' | 'muted' | 'label' | 'accent' | 'danger' | 'hero' | 'heroMuted' | 'onAccent';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
  weight?: FontWeightName;
  color?: string;
};

const variants: Record<Variant, TextStyle & { weight: FontWeightName }> = {
  display: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6, weight: 'extrabold' },
  title: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5, weight: 'extrabold' },
  heading: { fontSize: 18, lineHeight: 24, weight: 'extrabold' },
  body: { fontSize: 15, lineHeight: 22, weight: 'medium' },
  bodyStrong: { fontSize: 15, lineHeight: 22, weight: 'bold' },
  small: { fontSize: 13, lineHeight: 18, weight: 'medium' },
  caption: { fontSize: 12, lineHeight: 16, weight: 'medium' },
  overline: { fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: 'uppercase', weight: 'extrabold' },
};

function toneColor(colors: Palette, tone: Tone): string {
  switch (tone) {
    case 'muted':
      return colors.muted;
    case 'label':
      return colors.label;
    case 'accent':
      return colors.accent;
    case 'danger':
      return colors.danger;
    case 'hero':
      return colors.heroText;
    case 'heroMuted':
      return colors.heroMuted;
    case 'onAccent':
      return colors.onAccent;
    default:
      return colors.text;
  }
}

export function AppText({ variant = 'body', tone = 'default', weight, color, style, ...rest }: AppTextProps) {
  const { colors } = useAppTheme();
  const { weight: variantWeight, ...variantStyle } = variants[variant];
  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        { color: color ?? toneColor(colors, tone), fontFamily: FontFamily[weight ?? variantWeight] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
