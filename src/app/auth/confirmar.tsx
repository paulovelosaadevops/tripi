import type { EmailOtpType } from '@supabase/supabase-js';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

type Stage = 'checking' | 'confirmed' | 'new-password' | 'password-saved' | 'invalid';

const otpTypes: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];

/** Parâmetros do link do e-mail: o Supabase manda parte na query (?) e parte no fragmento (#). */
type LinkParams = Partial<
  Record<'tipo' | 'code' | 'token_hash' | 'type' | 'access_token' | 'refresh_token' | 'error' | 'error_code' | 'error_description', string>
>;

function readLinkFromAddress(fallback: LinkParams): LinkParams {
  if (Platform.OS !== 'web') return fallback;
  const { search, hash } = globalThis.location;
  const merged: Record<string, string> = {};
  for (const source of [new URLSearchParams(search), new URLSearchParams(hash.replace(/^#/, ''))]) {
    source.forEach((value, key) => {
      merged[key] = value;
    });
  }
  return merged as LinkParams;
}

/** O que dá para decidir só lendo o link; o resto depende de falar com o Supabase. */
function initialStage(link: LinkParams): Stage {
  if (link.error || link.error_code) return 'invalid';
  if (link.access_token && link.refresh_token && link.type === 'recovery') return 'checking';
  if (link.token_hash && link.type && otpTypes.includes(link.type as EmailOtpType)) return 'checking';
  // Confirmação de cadastro pelo link padrão: o Supabase já confirmou o e-mail antes de redirecionar.
  if (link.tipo === 'cadastro') return 'confirmed';
  return 'invalid';
}

/**
 * Página aberta pelos links dos e-mails do Supabase (templates padrão ou com token_hash):
 * confirmação de conta → "E-mail confirmado"; recuperação de senha → formulário de nova senha.
 * Funciona em qualquer aparelho, mesmo que o e-mail seja aberto longe de onde foi pedido.
 */
export default function ConfirmEmailLink() {
  const routeParams = useLocalSearchParams<LinkParams>();
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const [link] = useState(() => readLinkFromAddress(routeParams));
  const [stage, setStage] = useState<Stage>(() => initialStage(link));
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Cada link vale uma vez: evita repetir no modo de desenvolvimento.
    if (started.current) return;
    started.current = true;

    if (link.access_token && link.refresh_token && link.type === 'recovery') {
      supabase.auth
        .setSession({ access_token: link.access_token, refresh_token: link.refresh_token })
        .then(({ error: sessionError }) => setStage(sessionError ? 'invalid' : 'new-password'));
      return;
    }
    if (link.token_hash && link.type && otpTypes.includes(link.type as EmailOtpType)) {
      const type = link.type as EmailOtpType;
      supabase.auth.verifyOtp({ token_hash: link.token_hash, type }).then(({ error: verifyError }) => {
        if (verifyError) setStage('invalid');
        else setStage(type === 'recovery' ? 'new-password' : 'confirmed');
      });
      return;
    }
    // Cadastro aberto no mesmo navegador: além de confirmar, já entra na conta. Em outro aparelho isso falha
    // sem problema — o e-mail continua confirmado e basta entrar com e-mail e senha.
    if (link.tipo === 'cadastro' && link.code) {
      supabase.auth.exchangeCodeForSession(link.code).catch(() => undefined);
    }
  }, [link]);

  // Tira códigos e tokens da barra de endereço (e do histórico). O Expo Router reescreve o endereço original ao
  // montar a página e de novo quando a sessão muda (as rotas protegidas se reorganizam), então a limpeza roda
  // no ciclo seguinte a cada mudança de etapa ou de sessão.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const timer = setTimeout(() => globalThis.history.replaceState(null, '', globalThis.location.pathname), 0);
    return () => clearTimeout(timer);
  }, [stage, session]);

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

  const result: Record<'confirmed' | 'password-saved' | 'invalid', { icon: IconName; title: string; message: string; tint: { bg: string; fg: string } }> = {
    confirmed: {
      icon: 'check',
      title: 'E-mail confirmado!',
      message: 'Sua conta está ativa. Abra o Tripi e entre com seu e-mail e senha.',
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
      {stage === 'checking' && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText tone="muted">Conferindo o link…</AppText>
        </View>
      )}

      {stage === 'new-password' && (
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

      {(stage === 'confirmed' || stage === 'password-saved' || stage === 'invalid') && (
        <View style={styles.block} accessibilityLiveRegion="polite">
          <View style={[styles.badge, { backgroundColor: result[stage].tint.bg }]}>
            <Icon name={result[stage].icon} size={34} color={result[stage].tint.fg} strokeWidth={2.4} />
          </View>
          <AppText variant="title" accessibilityRole="header">
            {result[stage].title}
          </AppText>
          <AppText tone="muted">{result[stage].message}</AppText>
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
