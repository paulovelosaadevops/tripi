import type { EmailOtpType } from '@supabase/supabase-js';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/theme/theme-provider';

type Stage = 'checking' | 'confirmed' | 'new-password' | 'password-saved' | 'invalid';

const validTypes: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];

/**
 * Página aberta pelos links dos e-mails do Supabase (template com token_hash):
 * - confirmação de conta → "E-mail confirmado";
 * - recuperação de senha → formulário de nova senha.
 * Funciona em qualquer aparelho, mesmo que o e-mail seja aberto longe de onde a conta foi criada.
 */
export default function ConfirmEmailLink() {
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const { colors } = useAppTheme();
  const [stage, setStage] = useState<Stage>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  const type = params.type as EmailOtpType | undefined;
  const tokenHash = params.token_hash;
  const malformed = !tokenHash || !type || !validTypes.includes(type);

  useEffect(() => {
    // Um token só vale uma vez: evita a segunda verificação do modo de desenvolvimento.
    if (malformed || started.current) return;
    started.current = true;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: verifyError }) => {
      if (verifyError) setStage('invalid');
      else setStage(type === 'recovery' ? 'new-password' : 'confirmed');
    });
  }, [malformed, tokenHash, type]);

  const shown: Stage = malformed ? 'invalid' : stage;

  async function savePassword() {
    if (password.length < 8 || !/\d/.test(password) || !/[a-z]/i.test(password)) {
      setError('A senha precisa ter 8 caracteres, com letras e números.');
      return;
    }
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) setError('Não foi possível salvar a nova senha. Peça um novo link em "Esqueci minha senha".');
    else setStage('password-saved');
  }

  const result: Record<Exclude<Stage, 'checking' | 'new-password'>, { icon: IconName; title: string; message: string; tint: { bg: string; fg: string } }> = {
    confirmed: {
      icon: 'check',
      title: 'E-mail confirmado!',
      message: 'Sua conta está ativa. Volte ao app do Tripi no celular e entre com seu e-mail e senha.',
      tint: colors.green,
    },
    'password-saved': {
      icon: 'check',
      title: 'Senha alterada',
      message: 'Pronto! Use a nova senha para entrar no Tripi em qualquer aparelho.',
      tint: colors.green,
    },
    invalid: {
      icon: 'close',
      title: 'Link inválido ou expirado',
      message:
        'Este link já foi usado ou expirou. Se a sua conta já estiver confirmada, é só entrar normalmente. Para trocar a senha, peça um novo link em "Esqueci minha senha".',
      tint: colors.orange,
    },
  };

  return (
    <Screen contentStyle={styles.content}>
      {shown === 'checking' && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText tone="muted">Conferindo o link…</AppText>
        </View>
      )}

      {shown === 'new-password' && (
        <View style={styles.block}>
          <View style={[styles.badge, { backgroundColor: colors.green.bg }]}>
            <Icon name="user" size={32} color={colors.green.fg} />
          </View>
          <AppText variant="title" accessibilityRole="header">
            Crie uma nova senha
          </AppText>
          <TextField
            label="Nova senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={error}
            onSubmitEditing={savePassword}
            autoFocus
          />
          <Button label="Salvar nova senha" loading={saving} onPress={savePassword} />
        </View>
      )}

      {shown !== 'checking' && shown !== 'new-password' && (
        <View style={styles.block} accessibilityLiveRegion="polite">
          <View style={[styles.badge, { backgroundColor: result[shown].tint.bg }]}>
            <Icon name={result[shown].icon} size={34} color={result[shown].tint.fg} strokeWidth={2.4} />
          </View>
          <AppText variant="title" accessibilityRole="header">
            {result[shown].title}
          </AppText>
          <AppText tone="muted">{result[shown].message}</AppText>
          <Button label="Abrir o Tripi" variant="secondary" onPress={() => router.replace('/')} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 56 },
  center: { alignItems: 'center', gap: 16, paddingTop: 80 },
  block: { gap: 16 },
  badge: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
