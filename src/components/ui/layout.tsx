import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Backdrop, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  /** Barra fixa no rodapé (botão salvar, campo de texto…). */
  footer?: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Espaço extra no fim do conteúdo (para FAB ou barra de abas). */
  bottomSpace?: number;
  refreshControl?: ScrollViewProps['refreshControl'];
  /** Tela aberta como folha (presentation "modal"): no iOS a folha já começa abaixo da barra de status. */
  modal?: boolean;
};

export function Screen({ children, footer, header, scroll = true, contentStyle, bottomSpace = 24, refreshControl, modal }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = modal && Platform.OS === 'ios' ? 0 : insets.top;
  const { scheme } = useAppTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + (footer ? 0 : insets.bottom) }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      refreshControl={refreshControl}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.fill}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Backdrop />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.fill, { paddingTop: topInset }]}>
          {header}
          {content}
          {footer && <FooterBar>{footer}</FooterBar>}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function FooterBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useAppTheme();
  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(insets.bottom, 12) + 8,
          borderTopColor: scheme === 'dark' ? 'rgba(255,255,255,0.10)' : colors.tabBarBorder,
          backgroundColor: scheme === 'dark' ? 'rgba(6,16,13,0.72)' : colors.background,
        },
      ]}>
      {children}
    </View>
  );
}

type HeaderProps = {
  title?: string;
  /** "back" volta; "close" fecha um formulário. */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  trailing?: ReactNode;
};

export function ScreenHeader({ title, leading = 'back', onLeadingPress, trailing }: HeaderProps) {
  const goBack = onLeadingPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.header}>
      {leading === 'none' ? (
        <View style={styles.headerSide} />
      ) : (
        <IconButton icon={leading === 'close' ? 'close' : 'back'} label={leading === 'close' ? 'Fechar' : 'Voltar'} onPress={goBack} />
      )}
      {title ? (
        <AppText variant="heading" accessibilityRole="header" numberOfLines={1} style={styles.headerTitle}>
          {title}
        </AppText>
      ) : (
        <View style={styles.fill} />
      )}
      <View style={styles.headerSide}>{trailing}</View>
    </View>
  );
}

/** Título grande das abas ("Roteiro", "Gastos"…) com o nome da viagem em cima. */
export function TabTitle({ overline, title, trailing }: { overline?: string; title: string; trailing?: ReactNode }) {
  return (
    <View style={styles.tabTitle}>
      <View style={styles.tabTitleText}>
        {overline && (
          <AppText variant="small" weight="bold" tone="muted" numberOfLines={1}>
            {overline}
          </AppText>
        )}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {trailing}
    </View>
  );
}

export function SectionTitle({ children, trailing }: { children: string; trailing?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="overline" tone="muted" accessibilityRole="header">
        {children}
      </AppText>
      {trailing}
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
};

/** Linha de lista dentro de um <Surface>. */
export function ListRow({ title, subtitle, icon, value, onPress, isLast, disabled, trailing }: ListRowProps) {
  const { colors } = useAppTheme();
  const body = (
    <>
      {icon && <Icon name={icon} size={22} color={colors.accent} />}
      <View style={styles.fill}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        )}
      </View>
      {value && (
        <AppText variant="small" weight="bold" tone="muted">
          {value}
        </AppText>
      )}
      {trailing ?? (onPress && <Icon name="chevronRight" size={18} color={colors.muted} />)}
    </>
  );
  const rowStyle = [styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.separator }, disabled && { opacity: 0.5 }];
  if (!onPress) {
    return <View style={rowStyle}>{body}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => [rowStyle, pressed && { opacity: 0.7 }]}>
      {body}
    </Pressable>
  );
}

export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'hero' }) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { backgroundColor: tone === 'hero' ? colors.heroTrack : colors.track }]}>
      <View
        style={[
          styles.bar,
          { width: `${pct * 100}%`, backgroundColor: tone === 'hero' && colors.scheme === 'light' ? colors.apricot : colors.accent },
        ]}
      />
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  const { scheme } = useAppTheme();
  return (
    <View
      style={[
        styles.empty,
        {
          borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.22)' : '#B9C6C1',
          backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'transparent',
        },
      ]}>
      <AppText variant="bodyStrong" weight="extrabold" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="small" tone="muted" style={styles.center}>
        {message}
      </AppText>
      {action}
    </View>
  );
}

export function LoadingView() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.fill, styles.centered]}>
      <Backdrop />
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Surface style={styles.errorBox}>
      <AppText variant="bodyStrong">Algo deu errado</AppText>
      <AppText variant="small" tone="muted">
        {message}
      </AppText>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <AppText variant="small" weight="extrabold" tone="accent">
            Tentar de novo
          </AppText>
        </Pressable>
      )}
    </Surface>
  );
}

export const layoutStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  half: { flex: 1 },
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.lg },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, gap: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerSide: { width: 44, alignItems: 'flex-end' },
  headerTitle: { flex: 1, textAlign: 'center' },
  tabTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  tabTitleText: { flex: 1, gap: 2 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md + 2, minHeight: 58, paddingHorizontal: Spacing.lg },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  bar: { height: 10, borderRadius: 5 },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 36,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  errorBox: { padding: Spacing.lg, gap: Spacing.sm },
});
