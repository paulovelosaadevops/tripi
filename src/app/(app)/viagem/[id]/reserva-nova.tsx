import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField, TimeField } from '@/components/ui/field';
import { ErrorView, layoutStyles, LoadingView, Screen, ScreenHeader } from '@/components/ui/layout';
import { SwitchRow } from '@/components/ui/switch-row';
import { AppText } from '@/components/ui/text';
import { useCreateActivity, useCreateReservation, useDeleteReservation, useReservations, useUpdateReservation } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { formatBrazilianDate, isValidTime, moneyInput, parseBrazilianDate, parseMoney } from '@/lib/format';
import { ReservationFieldLabels, ReservationKindLabels } from '@/lib/labels';
import { closeScreen } from '@/lib/navigation';
import type { ActivityCategory, Reservation, ReservationKind } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';

const kinds = (Object.keys(ReservationKindLabels) as ReservationKind[]).map((value) => ({ value, label: ReservationKindLabels[value] }));

/** Horários são guardados como "hora local do destino" (sem conversão de fuso). */
function toTimestamp(date: string, time: string): string | null {
  const iso = parseBrazilianDate(date);
  if (!iso) return null;
  return `${iso}T${time && isValidTime(time) ? time : '00:00'}:00`;
}

/** "2026-11-12T22:15:00+00:00" → ["12/11/2026", "22:15"] (meia-noite vira horário vazio). */
function splitTimestamp(value: string | null | undefined): [string, string] {
  if (!value) return ['', ''];
  const time = value.slice(11, 16);
  return [formatBrazilianDate(value.slice(0, 10)), time === '00:00' ? '' : time];
}

const activityCategoryFor: Record<ReservationKind, ActivityCategory> = {
  voo: 'transporte',
  transporte: 'transporte',
  carro: 'transporte',
  hospedagem: 'hospedagem',
  ingresso: 'passeio',
  outro: 'outro',
};

/** Nova reserva, ou edição quando recebe `editId`. */
export default function ReservationScreen() {
  const id = useTripId();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const reservations = useReservations(id);
  if (!editId) return <ReservationForm tripId={id} />;
  const reservation = reservations.data?.find((r) => r.id === editId);
  if (reservations.isPending) return <LoadingView />;
  if (!reservation) {
    return (
      <Screen modal header={<ScreenHeader title="Reserva" leading="close" />}>
        <ErrorView message="Esta reserva não existe mais." />
      </Screen>
    );
  }
  return <ReservationForm tripId={id} reservation={reservation} />;
}

function ReservationForm({ tripId, reservation }: { tripId: string; reservation?: Reservation }) {
  const trip = useTrip(tripId);
  const create = useCreateReservation(tripId);
  const update = useUpdateReservation(tripId);
  const remove = useDeleteReservation(tripId);
  const createActivity = useCreateActivity(tripId);
  const localCurrency = trip.data?.local_currency ?? 'EUR';
  const editing = Boolean(reservation);
  const [initialStartDate, initialStartTime] = splitTimestamp(reservation?.starts_at);
  const [initialEndDate, initialEndTime] = splitTimestamp(reservation?.ends_at);

  const [kind, setKind] = useState<ReservationKind>(reservation?.kind ?? 'voo');
  const [title, setTitle] = useState(reservation?.title ?? '');
  const [code, setCode] = useState(reservation?.code ?? '');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [place, setPlace] = useState(reservation?.place ?? '');
  const [amount, setAmount] = useState(moneyInput(reservation?.amount));
  const [currency, setCurrency] = useState<string>(reservation?.currency ?? localCurrency);
  const [addToItinerary, setAddToItinerary] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const labels = ReservationFieldLabels[kind];
  const currencies = [...new Set([currency, localCurrency, 'BRL', 'USD', 'EUR'])].map((c) => ({ value: c, label: c }));

  async function save() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Preencha este campo.';
    const startsAt = startDate ? toTimestamp(startDate, startTime) : null;
    const endsAt = endDate ? toTimestamp(endDate, endTime) : null;
    if (startDate && !startsAt) next.startDate = 'Data inválida.';
    if (endDate && !endsAt) next.endDate = 'Data inválida.';
    if (startTime && !isValidTime(startTime)) next.startTime = 'Horário inválido.';
    if (endTime && !isValidTime(endTime)) next.endTime = 'Horário inválido.';
    if (startsAt && endsAt && endsAt < startsAt) next.endDate = 'O fim é antes do início.';
    const value = amount ? parseMoney(amount) : null;
    if (amount && value == null) next.amount = 'Valor inválido.';
    if (!editing && addToItinerary && !startsAt) next.startDate = 'Informe a data para colocar no roteiro.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input = {
      kind,
      title: title.trim(),
      code: code.trim().toUpperCase() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      place: place.trim() || null,
      amount: value,
      currency,
    };
    try {
      if (reservation) {
        await update.mutateAsync({ id: reservation.id, ...input });
      } else {
        const created = await create.mutateAsync({ ...input, addExpense: value != null && value > 0 });
        if (addToItinerary && startsAt) {
          await createActivity.mutateAsync({
            day: startsAt.slice(0, 10),
            start_time: startTime && isValidTime(startTime) ? startTime : null,
            end_time: null,
            title: created.title,
            category: activityCategoryFor[kind],
            place: created.place,
            estimated_cost: null,
            notes: created.code ? `Reserva ${created.code}` : null,
            reservation_id: created.id,
          });
        }
      }
      closeScreen({ pathname: '/viagem/[id]', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  async function destroy() {
    if (!reservation) return;
    const confirmed = await confirmAction(
      'Excluir reserva?',
      `"${reservation.title}" será apagada para todos, junto com o gasto e a atividade do roteiro criados por ela.`,
      'Excluir',
    );
    if (!confirmed) return;
    try {
      await remove.mutateAsync(reservation.id);
      closeScreen({ pathname: '/viagem/[id]', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title={editing ? 'Editar reserva' : 'Nova reserva'} leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button
            label={editing ? 'Salvar alterações' : 'Salvar reserva'}
            loading={create.isPending || update.isPending || createActivity.isPending}
            onPress={save}
          />
          {editing && <Button label="Excluir reserva" variant="danger" size="medium" loading={remove.isPending} onPress={destroy} />}
        </>
      }>
      <ChipGroup label="Tipo" options={kinds} value={kind} onChange={setKind} />
      <TextField label={labels.name} value={title} onChangeText={setTitle} placeholder={labels.namePlaceholder} error={errors.title} />
      <TextField
        label="Código da reserva"
        value={code}
        onChangeText={setCode}
        placeholder="Ex.: K7X9QP"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <View style={layoutStyles.row}>
        <DateField label={labels.start} value={startDate} onChangeText={setStartDate} error={errors.startDate} />
        <TimeField label="Hora" value={startTime} onChangeText={setStartTime} error={errors.startTime} />
      </View>
      <View style={layoutStyles.row}>
        <DateField label={labels.end} value={endDate} onChangeText={setEndDate} error={errors.endDate} />
        <TimeField label="Hora" value={endTime} onChangeText={setEndTime} error={errors.endTime} />
      </View>
      <TextField label={labels.place} value={place} onChangeText={setPlace} placeholder={labels.placePlaceholder} />
      <TextField
        label="Valor pago"
        value={amount}
        onChangeText={setAmount}
        placeholder="0,00"
        keyboardType="decimal-pad"
        hint={editing ? 'O gasto ligado a esta reserva é atualizado junto.' : 'Entra automaticamente em Gastos.'}
        error={errors.amount}
      />
      <ChipGroup label="Moeda" options={currencies} value={currency} onChange={setCurrency} scroll />
      {!editing && (
        <SwitchRow title="Adicionar ao roteiro" subtitle="Cria a atividade no dia do início" value={addToItinerary} onChange={setAddToItinerary} />
      )}
    </Screen>
  );
}
