import { useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField } from '@/components/ui/field';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { SwitchRow } from '@/components/ui/switch-row';
import { AppText } from '@/components/ui/text';
import { useCreateExpense } from '@/data/trip-content';
import { useTrip, useTripMembers } from '@/data/trips';
import { firstName, formatBrazilianDate, parseBrazilianDate, parseMoney, toISODate } from '@/lib/format';
import { ExpenseCategoryLabels } from '@/lib/labels';
import type { ExpenseCategory } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';
import { useTripId } from '@/providers/trip-id';
import { closeScreen } from '@/lib/navigation';

const categories = (Object.keys(ExpenseCategoryLabels) as ExpenseCategory[]).map((value) => ({
  value,
  label: ExpenseCategoryLabels[value],
}));

export default function NewExpenseScreen() {
  const id = useTripId();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const create = useCreateExpense(id);
  const localCurrency = trip.data?.local_currency ?? 'EUR';

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(localCurrency);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('alimentacao');
  const [date, setDate] = useState(formatBrazilianDate(toISODate(new Date())));
  const [paidBy, setPaidBy] = useState(session?.user.id ?? '');
  const [split, setSplit] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencies = [...new Set([localCurrency, 'BRL', 'USD', 'EUR'])].map((c) => ({ value: c, label: c }));
  const payers = (members.data ?? []).map((m) => ({
    value: m.user_id,
    label: m.user_id === session?.user.id ? 'Eu' : firstName(m.profiles?.name ?? '') || 'Viajante',
  }));
  const travelers = members.data?.length ?? 1;

  async function save() {
    const next: Record<string, string> = {};
    const value = parseMoney(amount);
    if (value == null || value <= 0) next.amount = 'Informe o valor.';
    if (!description.trim()) next.description = 'Descreva o gasto.';
    const spentOn = parseBrazilianDate(date);
    if (!spentOn) next.date = 'Data inválida.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        amount: value!,
        currency,
        description: description.trim(),
        category,
        spent_on: spentOn!,
        paid_by: paidBy || session!.user.id,
        split_equally: split,
      });
      closeScreen({ pathname: '/viagem/[id]', params: { id } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title="Novo gasto" leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label="Salvar gasto" loading={create.isPending} onPress={save} />
        </>
      }>
      <Surface variant="hero" radius={26} style={styles.amountCard}>
        <AppText variant="small" weight="bold" tone="heroMuted">
          Valor em {currency}
        </AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.heroMuted}
          keyboardType="decimal-pad"
          accessibilityLabel={`Valor em ${currency}`}
          autoFocus
          style={[styles.amountInput, { color: colors.heroText }]}
        />
        {errors.amount && (
          <AppText variant="caption" color={colors.apricot}>
            {errors.amount}
          </AppText>
        )}
      </Surface>
      <ChipGroup label="Moeda" options={currencies} value={currency} onChange={setCurrency} scroll />
      <TextField label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: Jantar em Alfama" error={errors.description} />
      <ChipGroup label="Categoria" options={categories} value={category} onChange={setCategory} />
      <DateField label="Data" value={date} onChangeText={setDate} error={errors.date} />
      {payers.length > 1 && <ChipGroup label="Pago por" options={payers} value={paidBy} onChange={setPaidBy} />}
      {travelers > 1 && (
        <SwitchRow title="Dividir igualmente" subtitle={`Entre os ${travelers} viajantes`} value={split} onChange={setSplit} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountCard: { padding: 20, gap: 6, alignItems: 'center' },
  amountInput: {
    fontFamily: FontFamily.extrabold,
    fontSize: 44,
    minWidth: 160,
    textAlign: 'center',
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
