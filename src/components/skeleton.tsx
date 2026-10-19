import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/theme-provider';

/** Bloco cinza pulsando no lugar do conteúdo enquanto carrega. */
export function SkeletonBlock({ width = '100%', height, radius = 8 }: { width?: DimensionValue; height: number; radius?: number }) {
  const { scheme } = useAppTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.14)' : '#DCE3E0' },
        animated,
      ]}
    />
  );
}

/** Carregamento de "Minhas viagens" — mesma forma da tela pronta. */
export function TripsSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Carregando suas viagens" accessibilityRole="progressbar">
      <SkeletonBlock width={120} height={12} radius={6} />
      <SkeletonBlock height={196} radius={24} />
      <SkeletonBlock width={100} height={12} radius={6} />
      <SkeletonBlock height={84} radius={20} />
      <SkeletonBlock height={84} radius={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
});
