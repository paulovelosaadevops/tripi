import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useAppTheme } from '@/theme/theme-provider';
import { Radius } from '@/theme/tokens';

const nativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

type SurfaceProps = ViewProps & {
  /** "card" para listas e blocos; "hero" para o destaque (verde no claro, vidro mais forte no escuro). */
  variant?: 'card' | 'hero';
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Cartão do app. No escuro vira vidro: Liquid Glass nativo no iOS 26+, translúcido nas outras plataformas.
 */
export function Surface({ variant = 'card', radius = Radius.lg, style, children, ...rest }: SurfaceProps) {
  const { colors, scheme } = useAppTheme();
  const base: ViewStyle = { borderRadius: radius, overflow: 'hidden' };

  if (scheme === 'dark') {
    const glassStyle: ViewStyle = {
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: variant === 'hero' ? 'rgba(255,255,255,0.22)' : colors.surfaceBorder,
    };
    if (nativeGlass) {
      return (
        <GlassView glassEffectStyle="regular" colorScheme="dark" style={[base, glassStyle, style]} {...rest}>
          {children}
        </GlassView>
      );
    }
    return (
      <View
        style={[base, glassStyle, { backgroundColor: variant === 'hero' ? colors.hero : colors.surface }, style]}
        {...rest}>
        {children}
      </View>
    );
  }

  const lightStyle: ViewStyle =
    variant === 'hero'
      ? { backgroundColor: colors.hero }
      : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder };
  return (
    <View style={[base, lightStyle, style]} {...rest}>
      {children}
    </View>
  );
}

/** Fundo da tela. No escuro desenha as luzes verde, damasco e azul atrás do vidro. */
export function Backdrop() {
  const { colors, scheme } = useAppTheme();
  if (scheme !== 'dark') {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />;
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 200">
        <Defs>
          <RadialGradient id="green" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#1AAA78" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#1AAA78" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="apricot" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F6A259" stopOpacity={0.36} />
            <Stop offset="1" stopColor="#F6A259" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blue" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#3C6EDC" stopOpacity={0.32} />
            <Stop offset="1" stopColor="#3C6EDC" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={5} cy={0} rx={75} ry={60} fill="url(#green)" />
        <Ellipse cx={100} cy={95} rx={55} ry={50} fill="url(#apricot)" />
        <Ellipse cx={20} cy={200} rx={70} ry={55} fill="url(#blue)" />
      </Svg>
    </View>
  );
}
