import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { closeScreen } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { emailLinkTarget } from '@/lib/web-url';
import { authErrorMessage, useAuth } from '@/providers/auth-provider';

/** Troca de e-mail: o Supabase manda um link de confirmação; a troca só vale depois de confirmar. */
export default function ChangeEmailScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function save() {
    const next = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) return setError('Digite um e-mail válido.');
    if (next === session?.user.email?.toLowerCase()) return setError('Este já é o seu e-mail.');
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser(
      { email: next },
      { emailRedirectTo: emailLinkTarget('/auth/confirmar?tipo=email') },
    );
    setSaving(false);
    if (updateError) setError(authErrorMessage(updateError));
    else setSentTo(next);
  }

  return (
    <Screen
      header={<ScreenHeader title="Alterar e-mail" />}
      footer={
        sentTo ? (
          <Button label="Voltar ao perfil" onPress={() => closeScreen('/perfil')} />
        ) : (
          <>
            {error && (
              <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
                {error}
              </AppText>
            )}
            <Button label="Enviar confirmação" loading={saving} onPress={save} />
          </>
        )
      }>
      {sentTo ? (
        <Surface style={{ padding: 16, gap: 6 }}>
          <AppText variant="bodyStrong" weight="extrabold">
            Confira sua caixa de entrada
          </AppText>
          <AppText variant="small" tone="muted">
            Enviamos um link para {sentTo}. Por segurança, o e-mail atual também pode receber um link: confirme nos dois. Até lá, continue
            entrando com {session?.user.email}. Não chegou? Olhe a pasta de spam.
          </AppText>
        </Surface>
      ) : (
        <>
          <AppText variant="small" tone="muted">
            E-mail atual: {session?.user.email}
          </AppText>
          <TextField
            label="Novo e-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
          />
        </>
      )}
    </Screen>
  );
}
