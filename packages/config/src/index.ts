export const supportedLocales = ["pt-BR", "en-US"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "pt-BR";

export const environments = ["local", "staging", "production"] as const;
export type TripiEnvironment = (typeof environments)[number];
