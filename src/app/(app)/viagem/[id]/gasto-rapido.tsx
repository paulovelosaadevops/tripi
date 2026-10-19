import { onlineManager } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { TextField } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useHomeCurrency } from '@/data/exchange';
import { commit } from '@/data/offline';
import { useCreateExpense } from '@/data/trip-content';
import { uploadReceipt, type PickedFile } from '@/data/trip-extras';
import { useTrip } from '@/data/trips';
import { parseMoney, toISODate } from '@/lib/format';
import { ExpenseCategoryLabels } from '@/lib/labels';
import { closeScreen } from '@/lib/navigation';
import type { ExpenseCategory } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';

const categoryIcons: Record<ExpenseCategory, IconName> = {
  alimentacao: 'note',
  transporte: 'plane',
  hospedagem: 'ticket',
  ingressos: 'ticket',
  compras: 'wallet',
  outros: 'dots',
};

/**
 * Gasto rápido: digite o valor e toque na categoria — pronto, salvo (também sem internet).
 * Pago por você, dividido igualmente, com a data de hoje; dá para ajustar depois em Gastos.
 */
export default function QuickExpenseScreen() {
  const id = useTripId();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const trip = useTrip(id);
  const home = useHomeCurrency();
  const create = useCreateExpense(id);
  const local = trip.data?.local_currency ?? 'EUR';

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState<ExpenseCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chosenCurrency = currency ?? local;
  const currencies = [...new Set([local, home, 'EUR', 'USD'])].map((c) => ({ value: c, label: c }));

  async function takePhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(source === 'camera' ? 'Permita o uso da câmera nos Ajustes.' : 'Permita o acesso às fotos nos Ajustes.');
      return;
    }
    // Qualidade menor: recibo só precisa ser legível, e assim cabe folgado no armazenamento gratuito.
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhoto({ uri: asset.uri, name: asset.fileName ?? 'recibo.jpg', mimeType: asset.mimeType ?? 'image/jpeg', webFile: asset.file });
    setError(null);
  }

  async function save(category: ExpenseCategory) {
    const value = parseMoney(amount);
    if (value == null || value <= 0) {
      setError('Digite o valor primeiro.');
      return;
    }
    if (photo && !onlineManager.isOnline()) {
      setError('Sem conexão: a foto do recibo precisa de internet. Tire a foto depois ou salve sem ela.');
      return;
    }
    setError(null);
    setSaving(category);
    try {
      const receipt_path = photo ? await uploadReceipt(id, photo) : null;
      await commit(create, {
        amount: value,
        currency: chosenCurrency,
        description: description.trim() || ExpenseCategoryLabels[category],
        category,
        spent_on: toISODate(new Date()),
        paid_by: session!.user.id,
        split_equally: true,
        receipt_path,
      });
      closeScreen({ pathname: '/viagem/[id]/gastos', params: { id } });
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <Screen modal header={<ScreenHeader title="Gasto rápido" leading="close" />}>
      <Surface variant="hero" radius={26} style={styles.hero}>
        <AppText variant="small" weight="bold" tone="heroMuted">
          Valor em {chosenCurrency}
        </AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.heroMuted}
          keyboardType="decimal-pad"
          accessibilityLabel={`Valor em ${chosenCurrency}`}
          autoFocus
          style={[styles.amount, { color: colors.heroText }]}
        />
      </Surface>

      <AppText variant="bodyStrong" weight="extrabold">
        Toque na categoria para salvar
      </AppText>
      <View style={styles.grid}>
        {(Object.keys(ExpenseCategoryLabels) as ExpenseCategory[]).map((category) => (
          <Pressable
            key={category}
            onPress={() => save(category)}
            disabled={saving != null}
            accessibilityRole="button"
            accessibilityLabel={`Salvar como ${ExpenseCategoryLabels[category]}`}
            style={styles.cell}>
            {({ pressed }) => (
              <Surface radius={18} style={[styles.category, (pressed || saving === category) && { opacity: 0.6 }]}>
                <Icon name={categoryIcons[category]} size={24} color={colors.accent} />
                <AppText variant="small" weight="bold">
                  {saving === category ? 'Salvando…' : ExpenseCategoryLabels[category]}
                </AppText>
              </Surface>
            )}
          </Pressable>
        ))}
      </View>

      {error && (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      )}

      <ChipGroup label="Moeda" options={currencies} value={chosenCurrency} onChange={setCurrency} scroll />
      <TextField label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Ex.: Pastéis de Belém" />

      <View style={styles.photoRow}>
        {photo ? (
          <>
            <Image source={{ uri: photo.uri }} style={styles.thumb} accessibilityLabel="Foto do recibo" />
            <AppText variant="small" weight="bold" style={styles.flex}>
              Recibo anexado
            </AppText>
            <Button label="Remover" variant="secondary" size="medium" onPress={() => setPhoto(null)} />
          </>
        ) : (
          <>
            {Platform.OS !== 'web' && (
              <Button label="Foto do recibo" icon="camera" variant="secondary" size="medium" style={styles.flex} onPress={() => takePhoto('camera')} />
            )}
            <Button
              label={Platform.OS === 'web' ? 'Anexar foto do recibo' : 'Da galeria'}
              icon={Platform.OS === 'web' ? 'camera' : undefined}
              variant="secondary"
              size="medium"
              style={styles.flex}
              onPress={() => takePhoto('library')}
            />
          </>
        )}
      </View>
      <AppText variant="caption" tone="muted">
        Fica como pago por você, dividido igualmente e com a data de hoje. Para mudar, abra o gasto depois em Gastos.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { padding: 20, gap: 6, alignItems: 'center' },
  amount: {
    fontFamily: FontFamily.extrabold,
    fontSize: 44,
    minWidth: 160,
    textAlign: 'center',
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '31%', flexGrow: 1 },
  category: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, minHeight: 84 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
});
