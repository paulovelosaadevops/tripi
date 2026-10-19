import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** Abre um lugar no app de mapas do aparelho (Apple Mapas no iOS, Google Maps nos demais). */
export function openPlace(query: string) {
  const q = encodeURIComponent(query);
  const url = Platform.OS === 'ios' ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
  return Linking.openURL(url);
}

/** Rota passando pelos lugares do dia, na ordem. */
export function openRoute(places: string[]) {
  if (places.length === 0) return Promise.resolve();
  if (places.length === 1) return openPlace(places[0]);
  const encoded = places.map(encodeURIComponent);
  if (Platform.OS === 'ios') {
    // Apple Mapas aceita origem e destino; as paradas intermediárias ficam na lista do app.
    return Linking.openURL(`https://maps.apple.com/?saddr=${encoded[0]}&daddr=${encoded[encoded.length - 1]}`);
  }
  const waypoints = encoded.slice(1, -1).join('%7C');
  return Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&origin=${encoded[0]}&destination=${encoded[encoded.length - 1]}${waypoints ? `&waypoints=${waypoints}` : ''}`,
  );
}

/** "Como chegar": rota do lugar atual até o endereço, no app de mapas do aparelho. */
export function openDirections(place: string) {
  const q = encodeURIComponent(place);
  const url = Platform.OS === 'ios' ? `https://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  return Linking.openURL(url);
}
