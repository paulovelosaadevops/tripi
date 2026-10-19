import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { authErrorMessage, useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (!email.trim()) return setError('Informe seu e-mail.');
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen header={<ScreenHeader title="Recuperar senha" />}>
      <View style={[styles.badge, { backgroundColor: colors.green.bg }]}>
        <Icon name="mail" size={32} color={colors.green.fg} />
      </View>
      {sent ? (
        <View style={styles.block} accessibilityLiveRegion="polite">
          <AppText variant="title">Confira seu e-mail</AppText>
          <AppText tone="muted">
            Se existir uma conta com esse e-mail, o link chega em alguns minutos. Veja também a caixa de spam.
          </AppText>
          <Button label="Voltar ao login" onPress={() => router.replace('/login')} />
          <Button label="Enviar de novo" variant="secondary" size="medium" onPress={() => setSent(false)} />
        </View>
      ) : (
        <View style={styles.block}>
          <AppText variant="title">Esqueceu a senha?</AppText>
          <AppText tone="muted">Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</AppText>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={error}
            onSubmitEditing={send}
          />
          <Button label="Enviar link" loading={busy} onPress={send} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  block: { gap: 16 },
});
