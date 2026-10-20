import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PendingInviteNotice, ResendConfirmation } from '@/components/auth-extras';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { showAppleLogin, showGoogleLogin } from '@/lib/auth-providers';
import { authErrorMessage, useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

export default function CreateAccountScreen() {
  const { signUp, signInWithProvider } = useAuth();
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim() || !email.trim()) return setError('Preencha nome e e-mail.');
    if (password.length < 8 || !/\d/.test(password) || !/[a-z]/i.test(password)) {
      return setError('A senha precisa ter 8 caracteres, com letras e números.');
    }
    if (!accepted) return setError('Aceite os termos para continuar.');
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(name, email, password);
      if (needsConfirmation) setConfirmSent(true);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (confirmSent) {
    return (
      <Screen header={<ScreenHeader title="Criar conta" />}>
        <AppText variant="title">Confirme seu e-mail</AppText>
        <AppText tone="muted">
          Enviamos um link para {email.trim()}. Toque nele para ativar a conta e depois entre com seu e-mail e senha.
        </AppText>
        <AppText variant="small" tone="muted">
          Não chegou em alguns minutos? Confira a pasta de spam ou lixo eletrônico e, se precisar, peça outro.
        </AppText>
        <ResendConfirmation email={email} />
        <PendingInviteNotice />
        <Button label="Voltar ao login" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  return (
    <Screen
      header={<ScreenHeader title="Criar conta" />}
      footer={<Button label="Criar conta" loading={busy} onPress={submit} />}>
      <PendingInviteNotice />
      <AppText tone="muted">Sua conta guarda as viagens na nuvem e sincroniza com quem viaja com você.</AppText>
      {showAppleLogin && (
        <Button label="Continuar com Apple" variant="secondary" onPress={() => signInWithProvider('apple').catch((e) => setError(authErrorMessage(e)))} />
      )}
      {showGoogleLogin && (
        <Button label="Continuar com Google" variant="secondary" onPress={() => signInWithProvider('google').catch((e) => setError(authErrorMessage(e)))} />
      )}
      <View style={styles.form}>
        <TextField label="Nome" value={name} onChangeText={setName} placeholder="Como quer ser chamado" autoComplete="name" textContentType="name" />
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Crie uma senha"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint="Mínimo de 8 caracteres, com letras e números."
        />
      </View>
      <Pressable
        onPress={() => setAccepted((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        style={styles.terms}>
        <View style={[styles.box, { borderColor: accepted ? colors.accent : colors.inputBorder, backgroundColor: accepted ? colors.accent : 'transparent' }]}>
          {accepted && <Icon name="check" size={16} color={colors.onAccent} strokeWidth={3} />}
        </View>
        <AppText variant="small" style={styles.flex}>
          Li e aceito os Termos de uso e a Política de privacidade.
        </AppText>
      </Pressable>
      {error && (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
