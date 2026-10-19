import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField } from '@/components/ui/field';
import { layoutStyles, Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { useCreateTrip } from '@/data/trips';
import { parseBrazilianDate, parseMoney } from '@/lib/format';
import { Currencies, TripTypeLabels } from '@/lib/labels';
import type { TripType } from '@/lib/types';

const tripTypes = (Object.keys(TripTypeLabels) as TripType[]).map((value) => ({ value, label: TripTypeLabels[value] }));
const currencyOptions = Currencies.map((c) => ({ value: c.code as string, label: c.code }));

export default function NewTripScreen() {
  const createTrip = useCreateTrip();
  const [destination, setDestination] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState<TripType>('lazer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    const next: Record<string, string> = {};
    const cities = destination.split(',').map((c) => c.trim()).filter(Boolean);
    if (cities.length === 0) next.destination = 'Informe pelo menos um destino.';
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
      const trip = await createTrip.mutateAsync({
        name: cities[0],
        destinations: cities,
        start_date: startISO,
        end_date: endISO,
        local_currency: currency,
        budget: budgetValue,
        trip_type: type,
      });
      router.dismiss();
      router.push({ pathname: '/viagem/[id]', params: { id: trip.id } });
    } catch {
      setErrors({ form: 'Não foi possível criar a viagem. Verifique a conexão e tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title="Nova viagem" leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label="Criar viagem" loading={createTrip.isPending} onPress={save} />
        </>
      }>
      <TextField
        label="Destino"
        value={destination}
        onChangeText={setDestination}
        placeholder="Ex.: Lisboa, Porto"
        hint="Separe várias cidades por vírgula. A primeira dá nome à viagem."
        error={errors.destination}
        autoFocus
      />
      <View style={layoutStyles.row}>
        <DateField label="Ida" value={start} onChangeText={setStart} error={errors.start} />
        <DateField label="Volta" value={end} onChangeText={setEnd} error={errors.end} />
      </View>
      <ChipGroup label="Moeda local" options={currencyOptions} value={currency} onChange={setCurrency} scroll />
      <TextField
        label="Orçamento total (opcional)"
        value={budget}
        onChangeText={setBudget}
        placeholder={`${currency} 0,00`}
        keyboardType="decimal-pad"
        error={errors.budget}
      />
      <ChipGroup label="Tipo de viagem" options={tripTypes} value={type} onChange={setType} />
      <AppText variant="small" tone="muted">
        Depois de criar, convide quem vai com você para dividir roteiro e gastos.
      </AppText>
    </Screen>
  );
}
