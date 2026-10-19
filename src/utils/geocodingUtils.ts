/**
 * Utility per la verifica in tempo reale dell'indirizzo e geolocalizzazione esatta al civico
 * nel raggio di 3 km dal centro di Villaggio Prenestino (Via Fosso dell'Osa 507, Roma).
 * Utilizza geocodifica ad alta precisione (ArcGIS + Nominatim fallback) gratuita e senza dipendenze da fatturazione Cloud.
 */

export const VILLAGGIO_PRENESTINO_CENTER = {
  lat: 41.8985,
  lng: 12.6865,
  address: "Via Fosso dell'Osa 507, 00132 Roma RM",
};

export const MAX_ALLOWED_RADIUS_KM = 3.0;

/**
 * Calcola la distanza Haversine in km tra due coordinate geografiche
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = VILLAGGIO_PRENESTINO_CENTER.lat,
  lon2: number = VILLAGGIO_PRENESTINO_CENTER.lng
): number {
  const R = 6371; // Raggio della Terra in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeocodeResult {
  isValid: boolean;
  lat: number;
  lng: number;
  distanceKm: number;
  formattedAddress: string;
  errorMsg?: string;
}

/**
 * Geocodifica l'indirizzo esatto al civico fornito dall'utente.
 * Valida che l'indirizzo si trovi entro il raggio di 3km da Via Fosso dell'Osa 507, Roma.
 */
export async function geocodeAndValidateAddress(addressInput: string): Promise<GeocodeResult> {
  const trimmed = addressInput.trim();
  if (!trimmed || trimmed.length < 3) {
    return {
      isValid: false,
      lat: VILLAGGIO_PRENESTINO_CENTER.lat,
      lng: VILLAGGIO_PRENESTINO_CENTER.lng,
      distanceKm: 0,
      formattedAddress: '',
      errorMsg: 'Inserisci un indirizzo e numero civico validi (es. Via Fosso dell\'Osa 507).',
    };
  }

  // Prepara query indirizzo per Roma
  let searchAddress = trimmed;
  if (!searchAddress.toLowerCase().includes('roma')) {
    searchAddress += ', Roma, Italia';
  }

  // 1. PRIMA SCELTA: ARCGIS WORLD GEOCODING API (Gratuito, altissima precisione sui civici italiani)
  try {
    const arcgisUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(
      searchAddress
    )}&outFields=Match_addr,Addr_type&maxLocations=1&location=${VILLAGGIO_PRENESTINO_CENTER.lng},${VILLAGGIO_PRENESTINO_CENTER.lat}`;

    const res = await fetch(arcgisUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const lat = candidate.location.y;
        const lng = candidate.location.x;
        const dist = calculateHaversineDistanceKm(lat, lng);

        if (dist > MAX_ALLOWED_RADIUS_KM) {
          return {
            isValid: false,
            lat,
            lng,
            distanceKm: Math.round(dist * 10) / 10,
            formattedAddress: candidate.address || trimmed,
            errorMsg: 'L\'indirizzo si trova fuori dal raggio consentito (oltre 3 km da Via Fosso dell\'Osa 507, Villaggio Prenestino).',
          };
        }

        return {
          isValid: true,
          lat,
          lng,
          distanceKm: Math.round(dist * 10) / 10,
          formattedAddress: candidate.address || trimmed,
        };
      }
    }
  } catch {
    // Prosegui al fallback Nominatim
  }

  // 2. SECONDA SCELTA: OPENSTREETMAP NOMINATIM CON VIEWBOX SUL QUARTIERE
  try {
    // Viewbox limitato all'area di Villaggio Prenestino (3km raggio)
    const viewbox = '12.63,41.86,12.72,41.93';
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchAddress
    )}&limit=1&addressdetails=1&viewbox=${viewbox}`;

    const res = await fetch(nominatimUrl, { headers: { 'Accept-Language': 'it' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const dist = calculateHaversineDistanceKm(lat, lng);
        const formatted = data[0].display_name || trimmed;

        if (dist > MAX_ALLOWED_RADIUS_KM) {
          return {
            isValid: false,
            lat,
            lng,
            distanceKm: Math.round(dist * 10) / 10,
            formattedAddress: formatted,
            errorMsg: 'L\'indirizzo si trova fuori dal raggio consentito (oltre 3 km da Via Fosso dell\'Osa 507, Villaggio Prenestino).',
          };
        }

        return {
          isValid: true,
          lat,
          lng,
          distanceKm: Math.round(dist * 10) / 10,
          formattedAddress: formatted,
        };
      }
    }
  } catch {
    // Prosegui
  }

  // 3. TERZA SCELTA: RICERCA PER VIA LOCALE (es. Via Fosso dell'Osa, Via Polense, Via Prenestina)
  const isLocalStreet = /via|piazza|largo|viale|corso|fosso/i.test(trimmed);
  if (isLocalStreet) {
    try {
      const streetOnly = trimmed.replace(/\d+/g, '').trim();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          streetOnly + ', Roma, Italia'
        )}&limit=1`,
        { headers: { 'Accept-Language': 'it' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const dist = calculateHaversineDistanceKm(lat, lng);

          if (dist <= MAX_ALLOWED_RADIUS_KM) {
            return {
              isValid: true,
              lat,
              lng,
              distanceKm: Math.round(dist * 10) / 10,
              formattedAddress: `${trimmed}, Villaggio Prenestino (Roma)`,
            };
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    isValid: false,
    lat: VILLAGGIO_PRENESTINO_CENTER.lat,
    lng: VILLAGGIO_PRENESTINO_CENTER.lng,
    distanceKm: 0,
    formattedAddress: '',
    errorMsg: 'Impossibile verificare l\'indirizzo. Inserisci una via e un civico validi di Villaggio Prenestino, Roma.',
  };
}
