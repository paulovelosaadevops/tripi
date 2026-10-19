import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { closeScreen } from '@/lib/navigation';
import { authErrorMessage, useAuth } from '@/providers/auth-provider';

/** Troca de senha com a conta aberta. Pede a senha atual para ninguém trocar num celular esquecido desbloqueado. */
export default function ChangePasswordScreen() {
  const { session } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    const email = session?.user.email;
    if (!email) return;
    if (!current) return setError('Informe a senha atual.');
    if (next.length < 8 || !/\d/.test(next) || !/[a-z]/i.test(next)) {
      return setError('A nova senha precisa ter 8 caracteres, com letras e números.');
    }
    if (next === current) return setError('A nova senha precisa ser diferente da atual.');
    setError(null);
    setSaving(true);
    try {
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) {
        setError('A senha atual está incorreta.');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) setError(authErrorMessage(updateError));
      else setDone(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      header={<ScreenHeader title="Alterar senha" />}
      footer={
        done ? (
          <Button label="Voltar ao perfil" onPress={() => closeScreen('/perfil')} />
        ) : (
          <>
            {error && (
              <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
                {error}
              </AppText>
            )}
            <Button label="Salvar nova senha" loading={saving} onPress={save} />
          </>
        )
      }>
      {done ? (
        <Surface style={{ padding: 16, gap: 6 }}>
          <AppText variant="bodyStrong" weight="extrabold">
            Senha alterada!
          </AppText>
          <AppText variant="small" tone="muted">
            Use a nova senha da próxima vez que entrar no Tripi em outro aparelho.
          </AppText>
        </Surface>
      ) : (
        <>
          <TextField
            label="Senha atual"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            autoFocus
          />
          <TextField
            label="Nova senha"
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            hint="Mínimo de 8 caracteres, com letras e números."
          />
        </>
      )}
    </Screen>
  );
}
