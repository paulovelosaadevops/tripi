import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { TripiMark } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { hasSocialLogin, showAppleLogin, showGoogleLogin } from '@/lib/auth-providers';
import { authErrorMessage, useAuth, type OAuthProvider } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

export default function LoginScreen() {
  const { signIn, signInWithProvider } = useAuth();
  const { colors, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: 'email' | OAuthProvider, action: () => Promise<void>) {
    setError(null);
    setBusy(kind);
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const submit = () => {
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    run('email', () => signIn(email, password));
  };

  const dark = scheme === 'dark';

  return (
    <Screen>
      <View style={[styles.hero, !dark && { backgroundColor: colors.hero, marginTop: -insets.top - 8, paddingTop: insets.top + 40 }]}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: dark ? 'rgba(255,255,255,0.10)' : colors.apricot }]}>
            <TripiMark size={26} color={dark ? colors.apricot : colors.hero} />
          </View>
          <AppText variant="title" tone={dark ? 'default' : 'hero'} style={styles.wordmark}>
            tripi
          </AppText>
        </View>
        <AppText variant="display" tone={dark ? 'default' : 'hero'} accessibilityRole="header">
          Entre para planejar sua viagem
        </AppText>
        <AppText tone={dark ? 'muted' : 'heroMuted'}>Roteiro, reservas e gastos sincronizados no seu celular.</AppText>
      </View>

      <Surface variant={dark ? 'hero' : 'card'} radius={28} style={[styles.card, !dark && styles.flatCard]}>
        {showAppleLogin && (
          <Button
            label="Continuar com Apple"
            variant="secondary"
            loading={busy === 'apple'}
            onPress={() => run('apple', () => signInWithProvider('apple'))}
          />
        )}
        {showGoogleLogin && (
          <Button
            label="Continuar com Google"
            variant="secondary"
            loading={busy === 'google'}
            onPress={() => run('google', () => signInWithProvider('google'))}
          />
        )}
        {hasSocialLogin && (
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.track }]} />
            <AppText variant="small" weight="bold" tone="muted">
              ou com e-mail
            </AppText>
            <View style={[styles.line, { backgroundColor: colors.track }]} />
          </View>
        )}
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <View>
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            style={styles.passwordInput}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            style={styles.reveal}>
            <AppText variant="small" weight="extrabold" tone="accent">
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </AppText>
          </Pressable>
        </View>
        <Link href="/esqueci-senha" asChild>
          <Pressable accessibilityRole="link" style={styles.forgot} hitSlop={6}>
            <AppText variant="small" weight="bold" tone="accent">
              Esqueci minha senha
            </AppText>
          </Pressable>
        </Link>
        {error && (
          <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        )}
        <Button label="Entrar" loading={busy === 'email'} onPress={submit} />
      </Surface>

      <View style={styles.footer}>
        <AppText variant="small" tone="muted">
          Não tem conta?
        </AppText>
        <Pressable onPress={() => router.push('/criar-conta')} accessibilityRole="link" hitSlop={8}>
          <AppText variant="small" weight="extrabold" tone="accent">
            Criar conta
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 14,
    marginHorizontal: -20,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wordmark: { letterSpacing: -1 },
  card: { padding: 20, gap: 14 },
  flatCard: { borderWidth: 0, backgroundColor: 'transparent', padding: 0, marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1 },
  passwordInput: { paddingRight: 84 },
  reveal: { position: 'absolute', right: 4, bottom: 2, height: 44, justifyContent: 'center', paddingHorizontal: 12 },
  forgot: { alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
});
