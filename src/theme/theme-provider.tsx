import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { readSetting, writeSetting } from '@/lib/storage';
import { Palettes, type Palette, type SchemeName } from '@/theme/tokens';

/** "auto" segue o modo do celular; "light"/"dark" fixam o tema. */
export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'tripi.theme';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  scheme: SchemeName;
  colors: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  const stored = readSetting(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'auto';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    writeSetting(STORAGE_KEY, value);
  }, []);

  const scheme: SchemeName = preference === 'auto' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const colors = Palettes[scheme];

  const value = useMemo(
    () => ({ preference, setPreference, scheme, colors }),
    [preference, setPreference, scheme, colors],
  );

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: colors.background, text: colors.text, primary: colors.accent },
    };
  }, [scheme, colors]);

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme precisa estar dentro de <AppThemeProvider>');
  }
  return value;
}
