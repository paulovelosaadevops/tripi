import { useQuery } from '@tanstack/react-query';

/**
 * Previsão do tempo e localização do destino pelo Open-Meteo (gratuito e sem cadastro).
 * https://open-meteo.com — a previsão cobre os próximos 16 dias; datas mais distantes ficam sem previsão.
 * Tudo fica no cache salvo no aparelho, então a última previsão aparece também offline.
 */

export type Place = { name: string; country: string; countryCode: string; latitude: number; longitude: number };

export type DayForecast = { code: number; max: number; min: number; rain: number | null };

/** Cidade → coordenadas e país. Muda raramente: fica guardada por muito tempo. */
export function usePlace(name: string | undefined) {
  return useQuery({
    queryKey: ['place', name],
    enabled: Boolean(name),
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<Place | null> => {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name!)}&count=1&language=pt&format=json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Localização indisponível (${response.status})`);
      const data = (await response.json()) as {
        results?: { name: string; country: string; country_code: string; latitude: number; longitude: number }[];
      };
      const hit = data.results?.[0];
      return hit
        ? { name: hit.name, country: hit.country, countryCode: hit.country_code, latitude: hit.latitude, longitude: hit.longitude }
        : null;
    },
  });
}

/** Previsão diária do destino, por data ISO ("2027-09-10" → previsão). */
export function useForecast(place: Place | null | undefined) {
  return useQuery({
    queryKey: ['forecast', place?.latitude, place?.longitude],
    enabled: Boolean(place),
    staleTime: 3 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<Record<string, DayForecast>> => {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${place!.latitude}&longitude=${place!.longitude}` +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16';
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Previsão indisponível (${response.status})`);
      const data = (await response.json()) as {
        daily: {
          time: string[];
          weather_code: number[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          precipitation_probability_max: (number | null)[];
        };
      };
      const byDay: Record<string, DayForecast> = {};
      data.daily.time.forEach((day, i) => {
        byDay[day] = {
          code: data.daily.weather_code[i],
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          rain: data.daily.precipitation_probability_max[i],
        };
      });
      return byDay;
    },
  });
}

/** Destino principal da viagem → previsão por dia (vazio se não houver destino ou previsão). */
export function useTripWeather(destinations: string[] | undefined) {
  const place = usePlace(destinations?.[0]?.trim() || undefined);
  const forecast = useForecast(place.data);
  return { place: place.data ?? null, forecast: forecast.data ?? {} };
}

/** Código WMO → ícone e descrição em português. */
export function describeWeather(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Céu limpo' };
  if (code <= 2) return { emoji: '🌤️', label: 'Poucas nuvens' };
  if (code === 3) return { emoji: '☁️', label: 'Nublado' };
  if (code === 45 || code === 48) return { emoji: '🌫️', label: 'Neblina' };
  if (code >= 51 && code <= 57) return { emoji: '🌦️', label: 'Garoa' };
  if (code >= 61 && code <= 67) return { emoji: '🌧️', label: 'Chuva' };
  if (code >= 71 && code <= 77) return { emoji: '🌨️', label: 'Neve' };
  if (code >= 80 && code <= 82) return { emoji: '🌦️', label: 'Pancadas de chuva' };
  if (code === 85 || code === 86) return { emoji: '🌨️', label: 'Pancadas de neve' };
  if (code >= 95) return { emoji: '⛈️', label: 'Tempestade' };
  return { emoji: '🌡️', label: 'Tempo variável' };
}
