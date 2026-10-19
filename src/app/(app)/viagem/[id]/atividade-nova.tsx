import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField, TimeField } from '@/components/ui/field';
import { ErrorView, layoutStyles, LoadingView, Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { commit } from '@/data/offline';
import { useActivities, useCreateActivity, useDeleteActivity, useUpdateActivity } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { eachDay, formatBrazilianDate, formatTime, formatWeekdayDayMonth, isValidTime, moneyInput, parseBrazilianDate, parseMoney } from '@/lib/format';
import { ActivityCategoryLabels } from '@/lib/labels';
import { closeScreen } from '@/lib/navigation';
import type { Activity, ActivityCategory } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';

const categories = (Object.keys(ActivityCategoryLabels) as ActivityCategory[]).map((value) => ({
  value,
  label: ActivityCategoryLabels[value],
}));

/** Nova atividade, ou edição quando recebe `editId`. */
export default function ActivityScreen() {
  const id = useTripId();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const activities = useActivities(id);
  if (!editId) return <ActivityForm tripId={id} />;
  const activity = activities.data?.find((a) => a.id === editId);
  if (activities.isPending) return <LoadingView />;
  if (!activity) {
    return (
      <Screen modal header={<ScreenHeader title="Atividade" leading="close" />}>
        <ErrorView message="Esta atividade não existe mais." />
      </Screen>
    );
  }
  return <ActivityForm tripId={id} activity={activity} />;
}

function ActivityForm({ tripId, activity }: { tripId: string; activity?: Activity }) {
  const { day: initialDay } = useLocalSearchParams<{ day?: string }>();
  const trip = useTrip(tripId);
  const create = useCreateActivity(tripId);
  const update = useUpdateActivity(tripId);
  const remove = useDeleteActivity(tripId);
  const editing = Boolean(activity);

  const tripDays = useMemo(() => {
    const t = trip.data;
    return t?.start_date && t.end_date ? eachDay(t.start_date, t.end_date) : null;
  }, [trip.data]);

  const [title, setTitle] = useState(activity?.title ?? '');
  const [category, setCategory] = useState<ActivityCategory>(activity?.category ?? 'passeio');
  const [pickedDay, setDay] = useState(activity?.day ?? initialDay ?? '');
  const [freeDate, setFreeDate] = useState(formatBrazilianDate(activity?.day));
  const [start, setStart] = useState(formatTime(activity?.start_time ?? null));
  const [end, setEnd] = useState(formatTime(activity?.end_time ?? null));
  const [place, setPlace] = useState(activity?.place ?? '');
  const [cost, setCost] = useState(moneyInput(activity?.estimated_cost));
  const [notes, setNotes] = useState(activity?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A viagem pode terminar de carregar depois do primeiro render. Dia fora das datas da viagem também aparece.
  const day = pickedDay || tripDays?.[0] || '';
  const dayList = tripDays && day && !tripDays.includes(day) ? [...tripDays, day].sort() : tripDays;
  const dayOptions = (dayList ?? []).map((d) => ({
    value: d,
    label: tripDays?.includes(d) ? `Dia ${tripDays.indexOf(d) + 1} · ${formatWeekdayDayMonth(d)}` : formatWeekdayDayMonth(d),
  }));

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

    const input = {
      day: chosenDay!,
      start_time: start || null,
      end_time: end || null,
      title: title.trim(),
      category,
      place: place.trim() || null,
      estimated_cost: costValue,
      notes: notes.trim() || null,
    };
    try {
      if (activity) await commit(update, { id: activity.id, ...input });
      else await commit(create, input);
      closeScreen({ pathname: '/viagem/[id]', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  async function destroy() {
    if (!activity) return;
    if (!(await confirmAction('Excluir atividade?', `"${activity.title}" sai do roteiro de todos os viajantes.`, 'Excluir'))) return;
    try {
      await commit(remove, { id: activity.id });
      closeScreen({ pathname: '/viagem/[id]', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title={editing ? 'Editar atividade' : 'Nova atividade'} leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label={editing ? 'Salvar alterações' : 'Salvar no roteiro'} loading={create.isPending || update.isPending} onPress={save} />
          {editing && <Button label="Excluir atividade" variant="danger" size="medium" loading={remove.isPending} onPress={destroy} />}
        </>
      }>
      {activity?.reservation_id && (
        <AppText variant="small" tone="muted">
          Esta atividade veio de uma reserva. Mudanças na reserva atualizam a atividade.
        </AppText>
      )}
      <TextField
        label="O que vai fazer?"
        value={title}
        onChangeText={setTitle}
        placeholder="Ex.: Visita ao Palácio da Pena"
        error={errors.title}
        autoFocus={!editing}
      />
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
