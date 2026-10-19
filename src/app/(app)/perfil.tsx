import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { ListRow, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useProfile, useTrips, useUpdateProfile } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { initials } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

const preferenceLabel = { auto: 'Automático', light: 'Claro', dark: 'Escuro' } as const;

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { colors, preference } = useAppTheme();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const trips = useTrips();
  const update = useUpdateProfile(userId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const confirmSignOut = async () => {
    if (await confirmAction('Sair da conta?', 'Suas viagens continuam salvas na nuvem.', 'Sair')) {
      await signOut();
    }
  };

  return (
    <Screen header={<ScreenHeader title="Perfil" />}>
      <View style={styles.identity}>
        <Surface variant="hero" radius={36} style={styles.avatar}>
          <AppText variant="title" tone="hero">
            {initials(profile.data?.name ?? session?.user.email ?? '')}
          </AppText>
        </Surface>
        <View style={styles.flex}>
          <AppText variant="heading">{profile.data?.name || 'Sem nome'}</AppText>
          <AppText variant="small" tone="muted">
            {session?.user.email}
          </AppText>
        </View>
        {!editing && (
          <Button
            label="Editar"
            variant="secondary"
            size="medium"
            onPress={() => {
              setName(profile.data?.name ?? '');
              setEditing(true);
            }}
          />
        )}
      </View>

      {editing && (
        <Surface style={styles.edit}>
          <TextField label="Nome" value={name} onChangeText={setName} autoComplete="name" />
          <Button
            label="Salvar"
            size="medium"
            loading={update.isPending}
            onPress={async () => {
              await update.mutateAsync({ name: name.trim() });
              setEditing(false);
            }}
          />
        </Surface>
      )}

      <Surface style={styles.sync} accessibilityRole="summary">
        <View style={[styles.syncIcon, { backgroundColor: colors.green.bg }]}>
          <Icon name="cloud" size={22} color={colors.green.fg} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong" weight="extrabold">
            Sincronizado com a nuvem
          </AppText>
          <AppText variant="small" tone="muted">
            {trips.data ? `${trips.data.length} ${trips.data.length === 1 ? 'viagem' : 'viagens'}` : 'Carregando…'}
          </AppText>
        </View>
      </Surface>

      <SectionTitle>Preferências</SectionTitle>
      <Surface>
        <ListRow title="Aparência" value={preferenceLabel[preference]} onPress={() => router.push('/aparencia')} />
        <ListRow title="Moeda de casa" value={profile.data?.home_currency ?? 'BRL'} isLast />
      </Surface>

      <Button label="Sair da conta" variant="secondary" icon="logout" onPress={confirmSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  edit: { padding: 16, gap: 12 },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  syncIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
