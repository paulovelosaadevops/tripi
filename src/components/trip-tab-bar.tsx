import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { CommonActions } from 'expo-router/react-navigation';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

const nativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

export const TabIcons: Record<string, IconName> = {
  index: 'compass',
  roteiro: 'calendar',
  reservas: 'ticket',
  gastos: 'wallet',
  mais: 'dots',
};

/**
 * Espaços que as abas reservam: no claro a barra fica no fluxo da tela; no escuro ela flutua por cima do conteúdo.
 * `content` é o respiro no fim da rolagem; `fab` é a distância do botão flutuante até o rodapé.
 */
export function useTabBarSpace(withFab = false) {
  const { scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  if (scheme !== 'dark') {
    return { content: withFab ? 96 : 24, fab: 20 };
  }
  const fab = Math.max(insets.bottom, 12) + 86;
  return { content: fab + (withFab ? 70 : 8), fab };
}

/**
 * Barra das abas da viagem.
 * Claro: barra branca no rodapé. Escuro: pílula de vidro flutuante (Liquid Glass no iOS 26+).
 */
export function TripTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors, scheme } = useAppTheme();
  const dark = scheme === 'dark';

  const items = state.routes.map((route, index) => {
    const focused = index === state.index;
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const color = focused ? colors.accent : colors.tabInactive;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        // Navega pela chave da rota existente para manter os parâmetros (o id da viagem).
        navigation.dispatch({ ...CommonActions.navigate(route), target: state.key });
      }
    };
    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        style={[styles.item, dark && focused && styles.itemFocusedDark]}>
        <Icon name={TabIcons[route.name] ?? 'dots'} size={22} color={color} strokeWidth={focused ? 2.1 : 1.8} />
        <AppText variant="caption" weight={focused ? 'extrabold' : 'semibold'} color={color} style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
      </Pressable>
    );
  });

  if (!dark) {
    return (
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
        ]}>
        {items}
      </View>
    );
  }

  const pill = [styles.pill, { bottom: Math.max(insets.bottom, 12) + 4, borderColor: colors.tabBarBorder }];
  return nativeGlass ? (
    <GlassView glassEffectStyle="regular" colorScheme="dark" isInteractive style={pill} accessibilityRole="tablist">
      {items}
    </GlassView>
  ) : (
    <View accessibilityRole="tablist" style={[pill, { backgroundColor: colors.tabBar }]}>
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
  },
  pill: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 2,
    padding: 6,
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  item: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 28,
  },
  itemFocusedDark: { backgroundColor: 'rgba(255,255,255,0.14)' },
  label: { fontSize: 10.5 },
});
