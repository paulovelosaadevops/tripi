import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField } from '@/components/ui/field';
import { ErrorView, layoutStyles, LoadingView, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { useDeleteTrip, useRemoveMember, useTrip, useTripMembers, useUpdateTrip } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { formatBrazilianDate, parseBrazilianDate, parseMoney } from '@/lib/format';
import { Currencies, TripTypeLabels } from '@/lib/labels';
import type { Trip, TripType } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { closeScreen } from '@/lib/navigation';

const tripTypes = (Object.keys(TripTypeLabels) as TripType[]).map((value) => ({ value, label: TripTypeLabels[value] }));
const currencyOptions = Currencies.map((c) => ({ value: c.code as string, label: c.code }));

export default function TripSettingsScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  if (trip.isPending) return <LoadingView />;
  if (!trip.data) {
    return (
      <Screen header={<ScreenHeader title="Configurações da viagem" />}>
        <ErrorView message="Não conseguimos abrir esta viagem." onRetry={() => trip.refetch()} />
      </Screen>
    );
  }
  return <SettingsForm trip={trip.data} />;
}

function SettingsForm({ trip }: { trip: Trip }) {
  const { session } = useAuth();
  const members = useTripMembers(trip.id);
  const update = useUpdateTrip(trip.id);
  const remove = useDeleteTrip(trip.id);
  const leave = useRemoveMember(trip.id);
  const myRole = members.data?.find((m) => m.user_id === session?.user.id)?.role;
  const canEdit = myRole === 'owner' || myRole === 'editor';

  const [name, setName] = useState(trip.name);
  const [destinations, setDestinations] = useState(trip.destinations.join(', '));
  const [start, setStart] = useState(formatBrazilianDate(trip.start_date));
  const [end, setEnd] = useState(formatBrazilianDate(trip.end_date));
  const [currency, setCurrency] = useState(trip.local_currency);
  const [budget, setBudget] = useState(trip.budget != null ? String(trip.budget).replace('.', ',') : '');
  const [type, setType] = useState<TripType>(trip.trip_type);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    const next: Record<string, string> = {};
    const cities = destinations.split(',').map((c) => c.trim()).filter(Boolean);
    if (!name.trim()) next.name = 'Dê um nome à viagem.';
    const startISO = start ? parseBrazilianDate(start) : null;
    const endISO = end ? parseBrazilianDate(end) : null;
    if (start && !startISO) next.start = 'Data inválida.';
    if (end && !endISO) next.end = 'Data inválida.';
    if (startISO && endISO && endISO < startISO) next.end = 'A volta é antes da ida.';
    const budgetValue = budget ? parseMoney(budget) : null;
    if (budget && budgetValue == null) next.budget = 'Valor inválido.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await update.mutateAsync({
        name: name.trim(),
        destinations: cities,
        start_date: startISO,
        end_date: endISO,
        local_currency: currency,
        budget: budgetValue,
        trip_type: type,
      });
      closeScreen({ pathname: '/viagem/[id]', params: { id: trip.id } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  async function archive() {
    if (!(await confirmAction('Arquivar viagem?', 'Ela sai de Minhas viagens, mas nada é apagado.', 'Arquivar'))) return;
    await update.mutateAsync({ archived_at: new Date().toISOString() });
    router.replace('/');
  }

  async function destroy() {
    if (!(await confirmAction('Excluir viagem?', 'Apaga roteiro, reservas, gastos e documentos para todos os viajantes. Não dá para desfazer.', 'Excluir'))) return;
    await remove.mutateAsync();
    router.replace('/');
  }

  async function leaveTrip() {
    if (!session || !(await confirmAction('Sair da viagem?', 'Você deixa de ver esta viagem. Para voltar, precisa de um novo convite.', 'Sair'))) return;
    await leave.mutateAsync(session.user.id);
    router.replace('/');
  }

  return (
    <Screen
      header={<ScreenHeader title="Configurações da viagem" />}
      footer={
        canEdit ? (
          <>
            {errors.form && (
              <AppText variant="small" tone="danger">
                {errors.form}
              </AppText>
            )}
            <Button label="Salvar alterações" loading={update.isPending} onPress={save} />
          </>
        ) : undefined
      }>
      {!canEdit && members.data && (
        <AppText variant="small" tone="muted">
          Você pode ver esta viagem, mas só quem tem permissão de edição altera as configurações.
        </AppText>
      )}
      <TextField label="Nome da viagem" value={name} onChangeText={setName} error={errors.name} editable={canEdit} />
      <TextField label="Cidades" value={destinations} onChangeText={setDestinations} hint="Separe por vírgula." editable={canEdit} />
      <View style={layoutStyles.row}>
        <DateField label="Ida" value={start} onChangeText={setStart} error={errors.start} editable={canEdit} />
        <DateField label="Volta" value={end} onChangeText={setEnd} error={errors.end} editable={canEdit} />
      </View>
      <ChipGroup label="Moeda local" options={currencyOptions} value={currency} onChange={canEdit ? setCurrency : () => {}} scroll />
      <TextField
        label="Orçamento total"
        value={budget}
        onChangeText={setBudget}
        placeholder={`${currency} 0,00`}
        keyboardType="decimal-pad"
        error={errors.budget}
        editable={canEdit}
      />
      <ChipGroup label="Tipo de viagem" options={tripTypes} value={type} onChange={canEdit ? setType : () => {}} />

      <SectionTitle>Zona de cuidado</SectionTitle>
      {canEdit && <Button label="Arquivar viagem" variant="secondary" size="medium" loading={update.isPending} onPress={archive} />}
      {myRole === 'owner' ? (
        <Button label="Excluir viagem" variant="danger" size="medium" loading={remove.isPending} onPress={destroy} />
      ) : (
        <Button label="Sair da viagem" variant="danger" size="medium" loading={leave.isPending} onPress={leaveTrip} />
      )}
    </Screen>
  );
}
