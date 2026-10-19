import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { keys, queryClient } from '@/data/query-client';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/theme/theme-provider';

/** Aberto pelo link tripi://convite/<código>. */
export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useAppTheme();
  const join = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('join_trip', { p_code: code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (tripId) => {
      queryClient.invalidateQueries({ queryKey: keys.trips });
      router.replace({ pathname: '/viagem/[id]', params: { id: tripId } });
    },
  });

  return (
    <Screen
      modal
      header={<ScreenHeader leading="close" onLeadingPress={() => router.replace('/')} />}
      footer={
        <>
          <Button label="Entrar na viagem" loading={join.isPending} onPress={() => join.mutate()} />
          <Button label="Agora não" variant="secondary" size="medium" onPress={() => router.replace('/')} />
        </>
      }>
      <View style={[styles.badge, { backgroundColor: colors.green.bg }]}>
        <Icon name="users" size={34} color={colors.green.fg} />
      </View>
      <AppText variant="small" weight="bold" tone="accent">
        Convite recebido
      </AppText>
      <AppText variant="title">Você foi convidado para uma viagem</AppText>
      <AppText tone="muted">
        Ao entrar, você poderá ver e editar o roteiro, adicionar reservas e registrar gastos. Tudo o que vocês adicionarem
        aparece para todos na hora.
      </AppText>
      {join.isError && (
        <AppText variant="small" tone="danger">
          Este convite não é válido ou foi desativado. Peça um link novo para quem organizou a viagem.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
