/**
 * Tokens do Tripi, iguais aos do protótipo no canvas.
 * Claro: verde-escuro + damasco sobre fundo cinza-esverdeado.
 * Escuro: "Liquid Glass" — painéis translúcidos sobre fundo quase preto com luzes de cor.
 */

export type SchemeName = 'light' | 'dark';

export type Tint = { bg: string; fg: string };

export type Palette = {
  scheme: SchemeName;
  background: string;
  text: string;
  muted: string;
  label: string;
  accent: string;
  onAccent: string;
  surface: string;
  surfaceBorder: string;
  hero: string;
  heroText: string;
  heroMuted: string;
  heroTrack: string;
  apricot: string;
  onApricot: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  track: string;
  separator: string;
  danger: string;
  dangerBorder: string;
  tabBar: string;
  tabBarBorder: string;
  tabInactive: string;
  green: Tint;
  orange: Tint;
  blue: Tint;
  purple: Tint;
};

export const Palettes: Record<SchemeName, Palette> = {
  light: {
    scheme: 'light',
    background: '#F2F4F3',
    text: '#10201C',
    muted: '#52615D',
    label: '#35443F',
    accent: '#0B6E4F',
    onAccent: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceBorder: '#E6EBE9',
    hero: '#0B3D2E',
    heroText: '#FFFFFF',
    heroMuted: '#CFE3DA',
    heroTrack: '#1F5A47',
    apricot: '#F4A259',
    onApricot: '#2A1606',
    inputBackground: '#FFFFFF',
    inputBorder: '#C9D2CF',
    placeholder: '#7D8B87',
    track: '#DCE2E0',
    separator: '#E6EBE9',
    danger: '#B3261E',
    dangerBorder: '#E8B4AE',
    tabBar: '#FFFFFF',
    tabBarBorder: '#DCE2E0',
    tabInactive: '#52615D',
    green: { bg: '#E3ECE8', fg: '#0B5A41' },
    orange: { bg: '#FCE9D6', fg: '#7A3D0C' },
    blue: { bg: '#E4ECF7', fg: '#1D3F6E' },
    purple: { bg: '#EEE6F3', fg: '#55306E' },
  },
  dark: {
    scheme: 'dark',
    background: '#06100D',
    text: '#F2F7F5',
    muted: '#B3C6BF',
    label: '#C9D8D2',
    accent: '#4BE3A5',
    onAccent: '#03140D',
    surface: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(255,255,255,0.15)',
    hero: 'rgba(255,255,255,0.10)',
    heroText: '#F2F7F5',
    heroMuted: '#B3C6BF',
    heroTrack: 'rgba(255,255,255,0.12)',
    apricot: '#F7B47C',
    onApricot: '#2A1606',
    inputBackground: 'rgba(0,0,0,0.22)',
    inputBorder: 'rgba(255,255,255,0.18)',
    placeholder: '#8EA39C',
    track: 'rgba(255,255,255,0.12)',
    separator: 'rgba(255,255,255,0.08)',
    danger: '#FF9A8F',
    dangerBorder: 'rgba(255,120,110,0.35)',
    // Sem Liquid Glass nativo não há desfoque: a barra precisa ser quase opaca para o conteúdo não vazar.
    tabBar: '#0E1815',
    tabBarBorder: 'rgba(255,255,255,0.16)',
    tabInactive: '#B3C6BF',
    green: { bg: 'rgba(75,227,165,0.16)', fg: '#8AF0C6' },
    orange: { bg: 'rgba(247,180,124,0.18)', fg: '#F9C9A0' },
    blue: { bg: 'rgba(110,160,255,0.18)', fg: '#B5CEFF' },
    purple: { bg: 'rgba(200,150,255,0.18)', fg: '#DEC2FF' },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

/** Manrope por peso — no Android cada peso é uma família separada. */
export const FontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export type FontWeightName = keyof typeof FontFamily;

/** Altura mínima de toque recomendada. */
export const TouchTarget = 44;
