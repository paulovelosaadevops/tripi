import { onlineManager } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DateField, TextField } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useUploadDocument, type PickedFile } from '@/data/trip-extras';
import { parseBrazilianDate } from '@/lib/format';
import { DocumentKindLabels } from '@/lib/labels';
import type { DocumentKind, DocumentVisibility } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { closeScreen } from '@/lib/navigation';

const kinds = (Object.keys(DocumentKindLabels) as DocumentKind[]).map((value) => ({ value, label: DocumentKindLabels[value] }));
const visibilities: { value: DocumentVisibility; label: string }[] = [
  { value: 'pessoal', label: 'Só meu' },
  { value: 'viagem', label: 'Da viagem' },
];

export default function NewDocumentScreen() {
  const id = useTripId();
  const upload = useUploadDocument(id);
  const { colors } = useAppTheme();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [kind, setKind] = useState<DocumentKind>('passaporte');
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('pessoal');
  const [expires, setExpires] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function applyFile(picked: PickedFile) {
    setFile(picked);
    if (!name) setName(picked.name.replace(/\.[^.]+$/, ''));
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    applyFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null, webFile: asset.file });
  }

  async function pickImage(source: 'camera' | 'library') {
    const permission =
      source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrors({ file: source === 'camera' ? 'Permita o uso da câmera nos Ajustes.' : 'Permita o acesso às fotos nos Ajustes.' });
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    applyFile({
      uri: asset.uri,
      name: asset.fileName ?? `foto-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      webFile: asset.file,
    });
  }

  async function save() {
    const next: Record<string, string> = {};
    if (!file) next.file = 'Escolha um arquivo ou tire uma foto.';
    if (!name.trim()) next.name = 'Dê um nome ao documento.';
    const expiresISO = expires ? parseBrazilianDate(expires) : null;
    if (expires && !expiresISO) next.expires = 'Data inválida.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!onlineManager.isOnline()) {
      setErrors({ form: 'Sem conexão. Para enviar o documento é preciso internet; tente de novo quando conectar.' });
      return;
    }
    try {
      await upload.mutateAsync({ file: file!, name: name.trim(), kind, visibility, expires_on: expiresISO });
      closeScreen({ pathname: '/viagem/[id]', params: { id } });
    } catch {
      setErrors({ form: 'Não foi possível enviar. Verifique a conexão e tente de novo.' });
    }
  }

  const sources: { label: string; icon: IconName; onPress: () => void }[] = [
    ...(Platform.OS !== 'web' ? [{ label: 'Câmera', icon: 'camera' as IconName, onPress: () => pickImage('camera') }] : []),
    { label: 'Fotos', icon: 'mountain', onPress: () => pickImage('library') },
    { label: 'Arquivo', icon: 'document', onPress: pickFile },
  ];

  return (
    <Screen
      modal
      header={<ScreenHeader title="Novo documento" leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label="Salvar documento" loading={upload.isPending} onPress={save} />
        </>
      }>
      {file ? (
        <Surface style={styles.file}>
          <Icon name="document" size={24} color={colors.accent} />
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.flex}>
            {file.name}
          </AppText>
          <Pressable onPress={() => setFile(null)} accessibilityRole="button" hitSlop={8}>
            <AppText variant="small" weight="extrabold" tone="accent">
              Trocar
            </AppText>
          </Pressable>
        </Surface>
      ) : (
        <View style={styles.sources}>
          {sources.map((source) => (
            <Pressable
              key={source.label}
              onPress={source.onPress}
              accessibilityRole="button"
              accessibilityLabel={`Escolher de ${source.label}`}
              style={[styles.source, { borderColor: colors.inputBorder }]}>
              <Icon name={source.icon} size={26} color={colors.label} />
              <AppText variant="small" weight="extrabold" tone="label">
                {source.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
      {errors.file && (
        <AppText variant="small" tone="danger">
          {errors.file}
        </AppText>
      )}
      <ChipGroup label="Tipo" options={kinds} value={kind} onChange={setKind} />
      <TextField label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Passaporte · Paulo" error={errors.name} />
      <ChipGroup label="Quem vê" options={visibilities} value={visibility} onChange={setVisibility} />
      <DateField label="Validade (opcional)" value={expires} onChangeText={setExpires} error={errors.expires} />
      <AppText variant="caption" tone="muted">
        “Só meu” aparece apenas para você. “Da viagem” aparece para todos os viajantes. Os arquivos ficam guardados na nuvem com acesso só
        para quem é da viagem.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sources: { flexDirection: 'row', gap: 10 },
  source: {
    flex: 1,
    height: 96,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  file: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
});
