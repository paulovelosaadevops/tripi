import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorView, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { SwitchRow } from '@/components/ui/switch-row';
import { AppText } from '@/components/ui/text';
import { useRemoveMember, useSetMemberRole, useTrip, useTripMembers, useUpdateTrip } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { initials } from '@/lib/format';
import { RoleLabels } from '@/lib/labels';
import { shareTripInvite } from '@/lib/share';
import type { TripMember } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

export default function TravelersScreen() {
  const id = useTripId();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const setRole = useSetMemberRole(id);
  const removeMember = useRemoveMember(id);
  const updateTrip = useUpdateTrip(id);

  const me = members.data?.find((m) => m.user_id === session?.user.id);
  const isOwner = me?.role === 'owner';
  const canEdit = isOwner || me?.role === 'editor';
  const link = trip.data ? Linking.createURL(`convite/${trip.data.invite_code}`) : '';

  async function remove(member: TripMember) {
    const name = member.profiles?.name || 'esta pessoa';
    if (!(await confirmAction('Remover da viagem?', `${name} deixa de ver a viagem.`, 'Remover'))) return;
    removeMember.mutate(member.user_id);
  }

  async function leave() {
    if (!session || !(await confirmAction('Sair da viagem?', 'Você deixa de ver esta viagem.', 'Sair'))) return;
    await removeMember.mutateAsync(session.user.id);
    router.replace('/');
  }

  return (
    <Screen header={<ScreenHeader title="Viajantes" />}>
      <SectionTitle>Nesta viagem</SectionTitle>
      {members.isPending && <SkeletonBlock height={130} radius={20} />}
      {members.isError && <ErrorView message="Não conseguimos carregar os viajantes." onRetry={() => members.refetch()} />}
      {members.data && (
        <Surface>
          {members.data.map((member, index) => {
            const mine = member.user_id === session?.user.id;
            const name = member.profiles?.name || 'Viajante';
            const tint = member.role === 'owner' ? colors.green : member.role === 'editor' ? colors.blue : colors.orange;
            return (
              <View
                key={member.user_id}
                style={[styles.row, index < members.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
                <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                  <AppText variant="small" weight="extrabold" color={tint.fg}>
                    {initials(name)}
                  </AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" weight="extrabold">
                    {name}
                    {mine ? ' (você)' : ''}
                  </AppText>
                  <AppText variant="small" tone="muted">
                    {RoleLabels[member.role]}
                  </AppText>
                </View>
                {isOwner && !mine && (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => setRole.mutate({ userId: member.user_id, role: member.role === 'viewer' ? 'editor' : 'viewer' })}
                      accessibilityRole="button"
                      style={[styles.small, { borderColor: colors.inputBorder }]}>
                      <AppText variant="caption" weight="extrabold">
                        {member.role === 'viewer' ? 'Permitir editar' : 'Só visualizar'}
                      </AppText>
                    </Pressable>
                    <Pressable onPress={() => remove(member)} accessibilityRole="button" accessibilityLabel={`Remover ${name}`} hitSlop={6}>
                      <AppText variant="caption" weight="extrabold" tone="danger">
                        Remover
                      </AppText>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </Surface>
      )}

      <SectionTitle>Convite</SectionTitle>
      <Surface variant="hero" radius={24} style={styles.invite}>
        <AppText variant="bodyStrong" weight="extrabold" tone="hero">
          Link de convite
        </AppText>
        <View style={[styles.link, { backgroundColor: colors.heroTrack }]}>
          <AppText variant="small" weight="bold" tone="hero" selectable numberOfLines={2}>
            {trip.data?.invite_link_enabled ? link : 'Link desativado'}
          </AppText>
        </View>
        <AppText variant="caption" tone="heroMuted">
          Quem abrir o link no celular com o Tripi entra na viagem podendo editar. Você muda isso aqui depois.
        </AppText>
        {trip.data?.invite_link_enabled && (
          <Button label="Compartilhar convite" icon="share" size="medium" onPress={() => trip.data && shareTripInvite(trip.data)} />
        )}
      </Surface>
      {canEdit && trip.data && (
        <SwitchRow
          title="Convite por link ativo"
          subtitle="Desligue para ninguém mais entrar com o link"
          value={trip.data.invite_link_enabled}
          onChange={(value) => updateTrip.mutate({ invite_link_enabled: value })}
        />
      )}

      {me && !isOwner && <Button label="Sair da viagem" variant="danger" size="medium" onPress={leave} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 16, paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actions: { alignItems: 'flex-end', gap: 8 },
  small: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  invite: { padding: 18, gap: 12 },
  link: { padding: 12, borderRadius: 14 },
});
