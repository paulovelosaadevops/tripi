import { Tabs } from 'expo-router/js-tabs';

import { TripTabBar } from '@/components/trip-tab-bar';
import { useAppTheme } from '@/theme/theme-provider';

export default function TripTabsLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      tabBar={(props) => <TripTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" options={{ title: 'Visão geral' }} />
      <Tabs.Screen name="roteiro" options={{ title: 'Roteiro' }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas' }} />
      <Tabs.Screen name="gastos" options={{ title: 'Gastos' }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
    </Tabs>
  );
}
