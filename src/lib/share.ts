import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import type { Trip } from '@/lib/types';

/** Abre o compartilhamento do sistema com o link de convite da viagem. */
export async function shareTripInvite(trip: Trip) {
  const url = Linking.createURL(`convite/${trip.invite_code}`);
  await Share.share({
    title: `Viagem ${trip.name} no Tripi`,
    message: `Entre na viagem "${trip.name}" comigo no Tripi: ${url}`,
    url,
  });
}
