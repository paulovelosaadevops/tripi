import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField, TimeField } from '@/components/ui/field';
import { layoutStyles, Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { useCreateActivity } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { eachDay, formatWeekdayDayMonth, isValidTime, parseBrazilianDate, parseMoney } from '@/lib/format';
import { ActivityCategoryLabels } from '@/lib/labels';
import type { ActivityCategory } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';
import { closeScreen } from '@/lib/navigation';

const categories = (Object.keys(ActivityCategoryLabels) as ActivityCategory[]).map((value) => ({
  value,
  label: ActivityCategoryLabels[value],
}));

export default function NewActivityScreen() {
  const id = useTripId();
  const { day: initialDay } = useLocalSearchParams<{ day?: string }>();
  const trip = useTrip(id);
  const create = useCreateActivity(id);

  const tripDays = useMemo(() => {
    const t = trip.data;
    return t?.start_date && t.end_date ? eachDay(t.start_date, t.end_date) : null;
  }, [trip.data]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('passeio');
  const [pickedDay, setDay] = useState(initialDay ?? '');
  const [freeDate, setFreeDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [place, setPlace] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A viagem pode terminar de carregar depois do primeiro render.
  const day = pickedDay || tripDays?.[0] || '';
  const dayOptions = (tripDays ?? []).map((d, i) => ({ value: d, label: `Dia ${i + 1} · ${formatWeekdayDayMonth(d)}` }));

  async function save() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Dê um nome à atividade.';
    const chosenDay = tripDays ? day : parseBrazilianDate(freeDate);
    if (!chosenDay) next.day = 'Escolha o dia.';
    if (start && !isValidTime(start)) next.start = 'Horário inválido.';
    if (end && !isValidTime(end)) next.end = 'Horário inválido.';
    const costValue = cost ? parseMoney(cost) : null;
    if (cost && costValue == null) next.cost = 'Valor inválido.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        day: chosenDay!,
        start_time: start || null,
        end_time: end || null,
        title: title.trim(),
        category,
        place: place.trim() || null,
        estimated_cost: costValue,
        notes: notes.trim() || null,
      });
      closeScreen({ pathname: '/viagem/[id]', params: { id } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title="Nova atividade" leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label="Salvar no roteiro" loading={create.isPending} onPress={save} />
        </>
      }>
      <TextField label="O que vai fazer?" value={title} onChangeText={setTitle} placeholder="Ex.: Visita ao Palácio da Pena" error={errors.title} autoFocus />
      <ChipGroup label="Categoria" options={categories} value={category} onChange={setCategory} />
      {tripDays ? (
        <View>
          <ChipGroup label="Dia" options={dayOptions} value={day} onChange={setDay} scroll />
          {errors.day && (
            <AppText variant="caption" tone="danger">
              {errors.day}
            </AppText>
          )}
        </View>
      ) : (
        <DateField label="Dia" value={freeDate} onChangeText={setFreeDate} error={errors.day} hint="A viagem ainda não tem datas definidas." />
      )}
      <View style={layoutStyles.row}>
        <TimeField label="Início" value={start} onChangeText={setStart} error={errors.start} />
        <TimeField label="Fim (opcional)" value={end} onChangeText={setEnd} error={errors.end} />
      </View>
      <TextField label="Local" value={place} onChangeText={setPlace} placeholder="Endereço ou nome do lugar" />
      <TextField
        label="Custo estimado"
        value={cost}
        onChangeText={setCost}
        placeholder={`${trip.data?.local_currency ?? ''} 0,00`}
        keyboardType="decimal-pad"
        hint="Entra no orçamento como previsto, não como gasto."
        error={errors.cost}
      />
      <TextField label="Notas" value={notes} onChangeText={setNotes} placeholder="Horários, links, dicas…" multiline />
    </Screen>
  );
}
