import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { readPendingInvite } from '@/lib/pending-invite';
import { authErrorMessage, useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

const COOLDOWN = 60;

/** "Reenviar e-mail de confirmação", com espera de 60 s entre envios (limite do Supabase). */
export function ResendConfirmation({ email }: { email: string }) {
  const { resendConfirmation } = useAuth();
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function resend() {
    setBusy(true);
    setMessage(null);
    try {
      await resendConfirmation(email);
      setMessage({ text: `Enviamos de novo para ${email.trim()}. Confira também a pasta de spam/lixo eletrônico.` });
      setWait(COOLDOWN);
    } catch (e) {
      setMessage({ text: authErrorMessage(e), error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.resend}>
      <Button
        label={wait > 0 ? `Reenviar em ${wait}s` : 'Reenviar e-mail de confirmação'}
        variant="secondary"
        size="medium"
        icon="mail"
        loading={busy}
        disabled={wait > 0 || !email.trim()}
        onPress={resend}
      />
      {message && (
        <AppText variant="small" tone={message.error ? 'danger' : 'accent'} accessibilityLiveRegion="polite">
          {message.text}
        </AppText>
      )}
    </View>
  );
}

/** Aviso no login/cadastro quando a pessoa chegou por um link de convite. */
export function PendingInviteNotice() {
  const { colors } = useAppTheme();
  const [pending] = useState(() => readPendingInvite());
  if (!pending) return null;
  return (
    <Surface style={styles.invite} accessibilityRole="summary">
      <View style={[styles.badge, { backgroundColor: colors.green.bg }]}>
        <Icon name="users" size={20} color={colors.green.fg} />
      </View>
      <AppText variant="small" weight="semibold" style={styles.flex}>
        Você recebeu um convite para uma viagem. Entre ou crie sua conta: o convite abre sozinho em seguida.
      </AppText>
    </Surface>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  resend: { gap: 8 },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
