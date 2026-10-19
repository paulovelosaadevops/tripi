/**
 * Telefones de emergência por país (código ISO de 2 letras). Ficam no próprio app, então funcionam offline.
 * Só países com números bem estabelecidos; para os demais, 112 costuma funcionar em celulares (GSM).
 */
export type EmergencyNumber = { label: string; number: string };

const EU_112: EmergencyNumber[] = [{ label: 'Emergência (polícia, ambulância, bombeiros)', number: '112' }];

const byCountry: Record<string, EmergencyNumber[]> = {
  PT: EU_112,
  ES: EU_112,
  IT: EU_112,
  NL: EU_112,
  BE: EU_112,
  AT: EU_112,
  GR: EU_112,
  IE: EU_112,
  DK: EU_112,
  SE: EU_112,
  FI: EU_112,
  NO: EU_112,
  PL: EU_112,
  CZ: EU_112,
  HU: EU_112,
  HR: EU_112,
  FR: [
    { label: 'Emergência geral', number: '112' },
    { label: 'Ambulância (SAMU)', number: '15' },
    { label: 'Polícia', number: '17' },
    { label: 'Bombeiros', number: '18' },
  ],
  DE: [
    { label: 'Ambulância e bombeiros', number: '112' },
    { label: 'Polícia', number: '110' },
  ],
  CH: [
    { label: 'Emergência geral', number: '112' },
    { label: 'Polícia', number: '117' },
    { label: 'Bombeiros', number: '118' },
    { label: 'Ambulância', number: '144' },
  ],
  GB: [{ label: 'Emergência (polícia, ambulância, bombeiros)', number: '999' }, { label: 'Também funciona', number: '112' }],
  US: [{ label: 'Emergência (polícia, ambulância, bombeiros)', number: '911' }],
  CA: [{ label: 'Emergência (polícia, ambulância, bombeiros)', number: '911' }],
  MX: [{ label: 'Emergência', number: '911' }],
  AR: [
    { label: 'Polícia', number: '911' },
    { label: 'Ambulância (SAME)', number: '107' },
    { label: 'Bombeiros', number: '100' },
  ],
  CL: [
    { label: 'Ambulância', number: '131' },
    { label: 'Bombeiros', number: '132' },
    { label: 'Polícia (Carabineros)', number: '133' },
  ],
  UY: [{ label: 'Emergência', number: '911' }],
  JP: [
    { label: 'Polícia', number: '110' },
    { label: 'Ambulância e bombeiros', number: '119' },
  ],
  AU: [{ label: 'Emergência (polícia, ambulância, bombeiros)', number: '000' }],
  NZ: [{ label: 'Emergência (polícia, ambulância, bombeiros)', number: '111' }],
  BR: [
    { label: 'Polícia Militar', number: '190' },
    { label: 'SAMU', number: '192' },
    { label: 'Bombeiros', number: '193' },
  ],
};

export function emergencyNumbers(countryCode: string | undefined): EmergencyNumber[] | null {
  return countryCode ? (byCountry[countryCode.toUpperCase()] ?? null) : null;
}
