import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { ListRow, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { SwitchRow } from '@/components/ui/switch-row';
import { AppText } from '@/components/ui/text';
import { nowIn, sendTestNotification, upcomingReminders, useReminderSettings, useSaveReminderSettings, type ReminderSettings } from '@/data/reminders';
import { useActivities, useReservations } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { formatWeekdayDayMonth } from '@/lib/format';
import { disablePush, enablePush, pushStatus, type PushStatus } from '@/lib/push';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

const minutesLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60}`);
const options = (values: number[]) => values.map((v) => ({ value: String(v), label: minutesLabel(v) }));

const deviceText: Record<PushStatus, { title: string; message: string }> = {
  on: { title: 'Este aparelho recebe os lembretes', message: 'Os avisos chegam mesmo com o Tripi fechado.' },
  off: { title: 'Notificações desligadas neste aparelho', message: 'Ative para receber os avisos de voo, check-out e atividades.' },
  denied: {
    title: 'Notificações bloqueadas',
    message: 'Libere nos ajustes do aparelho (Ajustes › Notificações › Tripi) ou do navegador e volte aqui.',
  },
  'needs-install': {
    title: 'Instale o Tripi na Tela de Início',
    message:
      'No iPhone, os avisos só funcionam com o app instalado: abra tripi.expo.app no Safari, toque em Compartilhar › Adicionar à Tela de Início e abra o Tripi pelo ícone.',
  },
  unsupported: {
    title: 'Notificações indisponíveis aqui',
    message: 'Use o Tripi pela versão web (no iPhone, instalada na Tela de Início) para receber os lembretes.',
  },
};

/** Lembretes por notificação: avisos antes de voos, atividades e check-outs, enviados pelo servidor. */
export default function RemindersScreen() {
  const id = useTripId();
  const { colors } = useAppTheme();
  const trip = useTrip(id);
  const reservations = useReservations(id);
  const activities = useActivities(id);
  const settings = useReminderSettings(id);
  const save = useSaveReminderSettings(id);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState<'enable' | 'test' | 'disable' | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    pushStatus().then(setStatus);
  }, []);

  const current = settings.data;
  const change = (patch: Partial<ReminderSettings>) => current && save.mutate({ ...current, ...patch });

  async function run(kind: 'enable' | 'test' | 'disable', action: () => Promise<string>) {
    setBusy(kind);
    setMessage(null);
    try {
      setMessage({ text: await action() });
    } catch (error) {
      const reason = (error as Error).message;
      setMessage({
        error: true,
        text:
          reason === 'denied'
            ? 'Você bloqueou as notificações. Libere nos ajustes do aparelho.'
            : reason === 'dismissed'
              ? 'Permissão não concedida. Tente de novo e toque em "Permitir".'
              : 'Não deu certo agora. Verifique a conexão e tente de novo.',
      });
    } finally {
      setBusy(null);
      setStatus(await pushStatus());
    }
  }

  const upcoming =
    current && reservations.data && activities.data
      ? upcomingReminders(current, reservations.data, activities.data, nowIn(trip.data?.timezone))
      : [];

  return (
    <Screen header={<ScreenHeader title="Lembretes" />}>
      {status && (
        <Surface style={styles.device}>
          <View style={styles.deviceTop}>
            <View style={[styles.badge, { backgroundColor: status === 'on' ? colors.green.bg : colors.orange.bg }]}>
              <Icon name={status === 'on' ? 'check' : 'bell'} size={20} color={status === 'on' ? colors.green.fg : colors.orange.fg} strokeWidth={2.2} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong" weight="extrabold">
                {deviceText[status].title}
              </AppText>
              <AppText variant="small" tone="muted">
                {deviceText[status].message}
              </AppText>
            </View>
          </View>
          {status === 'off' && (
            <Button
              label="Ativar notificações neste aparelho"
              icon="bell"
              loading={busy === 'enable'}
              onPress={() =>
                run('enable', async () => {
                  await enablePush();
                  if (current && !current.enabled) change({ enabled: true });
                  return 'Pronto! Este aparelho vai receber os lembretes.';
                })
              }
            />
          )}
          {status === 'on' && (
            <View style={styles.row}>
              <Button
                label="Enviar teste"
                variant="secondary"
                size="medium"
                style={styles.flex}
                loading={busy === 'test'}
                onPress={() =>
                  run('test', async () => {
                    const sent = await sendTestNotification();
                    return sent > 0 ? 'Teste enviado. A notificação deve aparecer em instantes.' : 'Nenhum aparelho recebeu. Desative e ative de novo.';
                  })
                }
              />
              <Button
                label="Desativar aqui"
                variant="secondary"
                size="medium"
                style={styles.flex}
                loading={busy === 'disable'}
                onPress={() =>
                  run('disable', async () => {
                    await disablePush();
                    return 'Este aparelho não vai mais receber lembretes.';
                  })
                }
              />
            </View>
          )}
          {message && (
            <AppText variant="small" tone={message.error ? 'danger' : 'accent'} accessibilityLiveRegion="polite">
              {message.text}
            </AppText>
          )}
        </Surface>
      )}

      {current && (
        <>
          <Surface>
            <SwitchRow
              title="Lembretes desta viagem"
              subtitle="Para você, em todos os seus aparelhos com notificações ativas"
              value={current.enabled}
              onChange={(enabled) => change({ enabled })}
            />
          </Surface>

          {current.enabled && (
            <View style={styles.section}>
              <SectionTitle>Avisar com antecedência</SectionTitle>
              <ChipGroup
                label="Voos"
                options={options([120, 180, 240])}
                value={String(current.flight_minutes)}
                onChange={(v) => change({ flight_minutes: Number(v) })}
              />
              <ChipGroup
                label="Atividades, passeios e embarques"
                options={options([30, 60, 120])}
                value={String(current.activity_minutes)}
                onChange={(v) => change({ activity_minutes: Number(v) })}
              />
              <ChipGroup
                label="Check-out e devolução do carro"
                options={options([30, 60, 120])}
                value={String(current.checkout_minutes)}
                onChange={(v) => change({ checkout_minutes: Number(v) })}
              />
            </View>
          )}

          {current.enabled && (
            <View style={styles.section}>
              <SectionTitle>Próximos avisos</SectionTitle>
              {upcoming.length > 0 ? (
                <Surface>
                  {upcoming.map((r, i) => (
                    <ListRow
                      key={r.key}
                      icon="bell"
                      title={r.title}
                      subtitle={`${formatWeekdayDayMonth(r.notifyAt.slice(0, 10))} às ${r.notifyAt.slice(11, 16)}${trip.data?.timezone ? ' (hora local)' : ''}`}
                      isLast={i === upcoming.length - 1}
                    />
                  ))}
                </Surface>
              ) : (
                <AppText variant="small" tone="muted">
                  Nada com horário marcado pela frente. Reservas e atividades com hora entram aqui sozinhas.
                </AppText>
              )}
            </View>
          )}
        </>
      )}

      <AppText variant="caption" tone="muted">
        Os avisos saem do servidor do Tripi a cada 10 minutos, no horário do destino. Só entram reservas e atividades com hora marcada.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: 10 },
  device: { padding: 16, gap: 14 },
  deviceTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 10 },
});
