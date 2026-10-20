import { Share } from 'react-native';

import type { Trip } from '@/lib/types';
import { emailLinkTarget } from '@/lib/web-url';

/** Abre o compartilhamento do sistema com o link de convite da viagem. */
export async function shareTripInvite(trip: Trip) {
  // Link da versão web: abre em qualquer celular, mesmo de quem ainda não tem o Tripi.
  const url = emailLinkTarget(`/convite/${trip.invite_code}`);
  await Share.share({
    title: `Viagem ${trip.name} no Tripi`,
    message: `Entre na viagem "${trip.name}" comigo no Tripi: ${url}`,
    url,
  });
}
