import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField, TimeField } from '@/components/ui/field';
import { layoutStyles, Screen, ScreenHeader } from '@/components/ui/layout';
import { SwitchRow } from '@/components/ui/switch-row';
import { AppText } from '@/components/ui/text';
import { useCreateActivity, useCreateReservation } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { isValidTime, parseBrazilianDate, parseMoney } from '@/lib/format';
import { ReservationFieldLabels, ReservationKindLabels } from '@/lib/labels';
import type { ActivityCategory, ReservationKind } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';
import { closeScreen } from '@/lib/navigation';

const kinds = (Object.keys(ReservationKindLabels) as ReservationKind[]).map((value) => ({ value, label: ReservationKindLabels[value] }));

/** Horários são guardados como "hora local do destino" (sem conversão de fuso). */
function toTimestamp(date: string, time: string): string | null {
  const iso = parseBrazilianDate(date);
  if (!iso) return null;
  return `${iso}T${time && isValidTime(time) ? time : '00:00'}:00`;
}

const activityCategoryFor: Record<ReservationKind, ActivityCategory> = {
  voo: 'transporte',
  transporte: 'transporte',
  carro: 'transporte',
  hospedagem: 'hospedagem',
  ingresso: 'passeio',
  outro: 'outro',
};

export default function NewReservationScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const create = useCreateReservation(id);
  const createActivity = useCreateActivity(id);
  const localCurrency = trip.data?.local_currency ?? 'EUR';

  const [kind, setKind] = useState<ReservationKind>('voo');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [place, setPlace] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(localCurrency);
  const [addToItinerary, setAddToItinerary] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const labels = ReservationFieldLabels[kind];
  const currencies = [...new Set([localCurrency, 'BRL', 'USD', 'EUR'])].map((c) => ({ value: c, label: c }));

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
    if (addToItinerary && !startsAt) next.startDate = 'Informe a data para colocar no roteiro.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      const reservation = await create.mutateAsync({
        kind,
        title: title.trim(),
        code: code.trim().toUpperCase() || null,
        starts_at: startsAt,
        ends_at: endsAt,
        place: place.trim() || null,
        amount: value,
        currency,
        addExpense: value != null && value > 0,
      });
      if (addToItinerary && startsAt) {
        await createActivity.mutateAsync({
          day: startsAt.slice(0, 10),
          start_time: startTime && isValidTime(startTime) ? startTime : null,
          end_time: null,
          title: reservation.title,
          category: activityCategoryFor[kind],
          place: reservation.place,
          estimated_cost: null,
          notes: reservation.code ? `Reserva ${reservation.code}` : null,
        });
      }
      closeScreen({ pathname: '/viagem/[id]', params: { id } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title="Nova reserva" leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label="Salvar reserva" loading={create.isPending || createActivity.isPending} onPress={save} />
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
        hint="Entra automaticamente em Gastos."
        error={errors.amount}
      />
      <ChipGroup label="Moeda" options={currencies} value={currency} onChange={setCurrency} scroll />
      <SwitchRow title="Adicionar ao roteiro" subtitle="Cria a atividade no dia do início" value={addToItinerary} onChange={setAddToItinerary} />
    </Screen>
  );
}
