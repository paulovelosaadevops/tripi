import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField } from '@/components/ui/field';
import { ErrorView, LoadingView, Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { SwitchRow } from '@/components/ui/switch-row';
import { AppText } from '@/components/ui/text';
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '@/data/trip-content';
import { useTrip, useTripMembers } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { firstName, formatBrazilianDate, moneyInput, parseBrazilianDate, parseMoney, toISODate } from '@/lib/format';
import { ExpenseCategoryLabels } from '@/lib/labels';
import { closeScreen } from '@/lib/navigation';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';

const categories = (Object.keys(ExpenseCategoryLabels) as ExpenseCategory[]).map((value) => ({
  value,
  label: ExpenseCategoryLabels[value],
}));

/** Novo gasto, ou edição quando recebe `editId`. */
export default function ExpenseScreen() {
  const id = useTripId();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const expenses = useExpenses(id);
  if (!editId) return <ExpenseForm tripId={id} />;
  const expense = expenses.data?.find((e) => e.id === editId);
  if (expenses.isPending) return <LoadingView />;
  if (!expense) {
    return (
      <Screen modal header={<ScreenHeader title="Gasto" leading="close" />}>
        <ErrorView message="Este gasto não existe mais." />
      </Screen>
    );
  }
  return <ExpenseForm tripId={id} expense={expense} />;
}

function ExpenseForm({ tripId, expense }: { tripId: string; expense?: Expense }) {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const trip = useTrip(tripId);
  const members = useTripMembers(tripId);
  const create = useCreateExpense(tripId);
  const update = useUpdateExpense(tripId);
  const remove = useDeleteExpense(tripId);
  const localCurrency = trip.data?.local_currency ?? 'EUR';
  const editing = Boolean(expense);

  const [amount, setAmount] = useState(moneyInput(expense?.amount));
  const [currency, setCurrency] = useState<string>(expense?.currency ?? localCurrency);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'alimentacao');
  const [date, setDate] = useState(formatBrazilianDate(expense?.spent_on ?? toISODate(new Date())));
  const [paidBy, setPaidBy] = useState(expense?.paid_by ?? session?.user.id ?? '');
  const [split, setSplit] = useState(expense?.split_equally ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencies = [...new Set([currency, localCurrency, 'BRL', 'USD', 'EUR'])].map((c) => ({ value: c, label: c }));
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

    const input = {
      amount: value!,
      currency,
      description: description.trim(),
      category,
      spent_on: spentOn!,
      paid_by: paidBy || session!.user.id,
      split_equally: split,
    };
    try {
      if (expense) await update.mutateAsync({ id: expense.id, ...input });
      else await create.mutateAsync(input);
      closeScreen({ pathname: '/viagem/[id]', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique a conexão e tente de novo.' });
    }
  }

  async function destroy() {
    if (!expense) return;
    if (!(await confirmAction('Excluir gasto?', `"${expense.description}" sai dos gastos de todos os viajantes.`, 'Excluir'))) return;
    try {
      await remove.mutateAsync(expense.id);
      closeScreen({ pathname: '/viagem/[id]', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title={editing ? 'Editar gasto' : 'Novo gasto'} leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label={editing ? 'Salvar alterações' : 'Salvar gasto'} loading={create.isPending || update.isPending} onPress={save} />
          {editing && <Button label="Excluir gasto" variant="danger" size="medium" loading={remove.isPending} onPress={destroy} />}
        </>
      }>
      {expense?.reservation_id && (
        <AppText variant="small" tone="muted">
          Este gasto veio de uma reserva. Se você editar a reserva depois, ele é atualizado de novo a partir dela.
        </AppText>
      )}
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
          autoFocus={!editing}
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
