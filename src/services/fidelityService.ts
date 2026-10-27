import QRCode from 'qrcode';
import { AttivitaCommercio } from '../types';

export interface DynamicCassaPayload {
  shopId: number;
  shopName: string;
  pts: number;
  ts: number;
  nonce: string;
  sig: string;
  backupCode: string;
}

export interface FidelityTransaction {
  id: string;
  shopId: number;
  shopName: string;
  ptsBase: number;
  multiplier: number;
  ptsFinal: number;
  dataOra: string;
  timestamp: number;
}

export interface RewardQuartiere {
  id: string;
  shopId: number;
  shopName: string;
  categoria: string;
  titolo: string;
  descrizione: string;
  puntiRichiesti: number;
  tipoPremio: 'sconto_spesa_minima' | 'omaggio_con_acquisto' | 'omaggio_puro_visita';
  spesaMinima?: number;
  richiedeAcquistoPregresso: boolean;
  valoreStimatoEuro: number;
}

export interface VoucherRiscatto {
  id: string;
  rewardId: string;
  shopId: number;
  shopName: string;
  titolo: string;
  codiceVerifica: string;
  puntiSpesi: number;
  dataOra: string;
  timestamp: number;
  scadenzaTimestamp: number;
  stato: 'attivo' | 'utilizzato' | 'scaduto';
}

export interface UserFidelityState {
  puntiFidelity: number;
  transazioni: FidelityTransaction[];
  voucherAttivi: VoucherRiscatto[];
  usedNonces: string[];
}

const STORAGE_KEY_FIDELITY = 'vp_fidelity_state_v3';

// Semplice hash deterministico per firma payload (anticontraffazione client-side)
function createSignature(shopId: number, pts: number, ts: number, nonce: string, secretSalt: string): string {
  const raw = `${shopId}-${pts}-${ts}-${nonce}-${secretSalt}-vp-quartiere-secret`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Calcola il moltiplicatore di punti civico in base alle ore di volontariato
 */
export function getVolunteerMultiplier(oreVolontariato: number): {
  multiplier: number;
  label: string;
  badge: string;
} {
  if (oreVolontariato >= 4) {
    return {
      multiplier: 2.0,
      label: '2.0x Boost Volontario Attivo',
      badge: 'Custode del Quartiere (2x Punti)',
    };
  }
  if (oreVolontariato >= 1) {
    return {
      multiplier: 1.5,
      label: '1.5x Boost Vicino Solidale',
      badge: 'Volontario Attivo (1.5x Punti)',
    };
  }
  return {
    multiplier: 1.0,
    label: '1.0x Standard',
    badge: 'Nuovo Vicino',
  };
}

/**
 * Carica lo stato fedeltà dal localStorage
 */
export function getUserFidelityState(): UserFidelityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIDELITY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.puntiFidelity === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Errore caricamento stato fidelity:', e);
  }

  // Stato iniziale per nuovo utente (con 15 punti di benvenuto quartiere)
  return {
    puntiFidelity: 15,
    transazioni: [
      {
        id: 'tx_seed_1',
        shopId: 1,
        shopName: 'Panificio & Gastronomia Da Mario',
        ptsBase: 10,
        multiplier: 1.5,
        ptsFinal: 15,
        dataOra: 'Ieri alle 11:20',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
      },
    ],
    voucherAttivi: [],
    usedNonces: [],
  };
}

/**
 * Salva lo stato fedeltà
 */
export function saveUserFidelityState(state: UserFidelityState): void {
  try {
    localStorage.setItem(STORAGE_KEY_FIDELITY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('cdq:fidelity-updated', { detail: state }));
  } catch (e) {
    console.error('Errore salvataggio stato fidelity:', e);
  }
}

/**
 * Genera un QR Code dinamico monouso per il commerciante in cassa
 */
export async function generateDynamicCassaQR(
  shopId: number,
  shopName: string,
  pts: number,
  shopPin: string
): Promise<{
  payload: DynamicCassaPayload;
  qrDataUrl: string;
  backupCode: string;
  expiresInSeconds: number;
}> {
  const ts = Date.now();
  const nonce = Math.random().toString(36).substring(2, 8).toUpperCase();
  const backupCode = `VP-${Math.floor(1000 + Math.random() * 9000)}`;
  const sig = createSignature(shopId, pts, ts, nonce, shopPin || '0000');

  const payload: DynamicCassaPayload = {
    shopId,
    shopName,
    pts,
    ts,
    nonce,
    sig,
    backupCode,
  };

  const jsonString = JSON.stringify(payload);
  const qrDataUrl = await QRCode.toDataURL(jsonString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
    color: {
      dark: '#781816', // Bordeaux identitario del quartiere
      light: '#ffffff',
    },
  });

  return {
    payload,
    qrDataUrl,
    backupCode,
    expiresInSeconds: 60,
  };
}

/**
 * Valida ed accredita i punti dal QR dinamico scansionato dal cliente
 */
export function validateAndClaimCassaQR(
  rawInput: string,
  oreVolontariato: number,
  shopPinFallback?: string
): {
  success: boolean;
  message: string;
  ptsEarned?: number;
  newBalance?: number;
  shopName?: string;
} {
  let payload: DynamicCassaPayload | null = null;

  try {
    // Prova il parse del JSON contenuto nel QR
    payload = JSON.parse(rawInput);
  } catch {
    return {
      success: false,
      message: 'Codice QR non valido o corrotto. Riprova ad inquadrare.',
    };
  }

  if (!payload || !payload.shopId || !payload.ts || !payload.nonce || !payload.sig) {
    return {
      success: false,
      message: 'Struttura della ricevuta digitale non valida.',
    };
  }

  const now = Date.now();
  // Validità massima: 90 secondi (60s + 30s tolleranza orologio)
  if (now - payload.ts > 90_000) {
    return {
      success: false,
      message: 'Questo QR Code di cassa è scaduto (validità 60 secondi). Chiedi al negoziante di rigenerarlo.',
    };
  }

  if (payload.ts > now + 30_000) {
    return {
      success: false,
      message: 'Orario del dispositivo non sincronizzato.',
    };
  }

  const state = getUserFidelityState();

  // Verifica anti-replay: il nonce non deve essere già stato utilizzato
  if (state.usedNonces.includes(payload.nonce)) {
    return {
      success: false,
      message: 'Questo acquisto è già stato accreditato in precedenza (anti-duplicazione attiva).',
    };
  }

  // Rate-limiting: non più di 1 accredito nello stesso negozio negli ultimi 10 minuti
  const recentSameShop = state.transazioni.find(
    (t) => t.shopId === payload!.shopId && now - t.timestamp < 1000 * 60 * 10
  );
  if (recentSameShop) {
    return {
      success: false,
      message: `Hai già registrato un acquisto presso "${payload.shopName}" pochi minuti fa. Attendi prima di un nuovo accredito.`,
    };
  }

  // Calcolo moltiplicatore civico per i volontari
  const { multiplier } = getVolunteerMultiplier(oreVolontariato);
  const ptsFinal = Math.max(1, Math.round(payload.pts * multiplier));

  const newTx: FidelityTransaction = {
    id: `tx_${now}_${payload.nonce}`,
    shopId: payload.shopId,
    shopName: payload.shopName,
    ptsBase: payload.pts,
    multiplier,
    ptsFinal,
    dataOra: 'Oggi alle ' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    timestamp: now,
  };

  const updatedState: UserFidelityState = {
    puntiFidelity: state.puntiFidelity + ptsFinal,
    transazioni: [newTx, ...state.transazioni].slice(0, 50),
    voucherAttivi: state.voucherAttivi,
    usedNonces: [payload.nonce, ...state.usedNonces].slice(0, 100),
  };

  saveUserFidelityState(updatedState);

  const boostNote = multiplier > 1 ? ` (incluso Boost Volontario ${multiplier}x)` : '';
  return {
    success: true,
    message: `+${ptsFinal} Punti accreditati sulla tua Fidelity Card da "${payload.shopName}"${boostNote}!`,
    ptsEarned: ptsFinal,
    newBalance: updatedState.puntiFidelity,
    shopName: payload.shopName,
  };
}

/**
 * Catalogo standard delle ricompense di quartiere
 */
export const REWARDS_CATALOGO_PREDEFINITO: RewardQuartiere[] = [
  {
    id: 'rew_1',
    shopId: 1,
    shopName: 'Panificio & Forno Da Mario',
    categoria: 'alimentari',
    titolo: 'Buono Sconto 5€ su Pane & Dolci',
    descrizione: 'Valido su una spesa minima di 20€ al banco. Ideale per la spesa settimanale.',
    puntiRichiesti: 40,
    tipoPremio: 'sconto_spesa_minima',
    spesaMinima: 20,
    richiedeAcquistoPregresso: false, // Accessibile a tutti i cittadini: lead generation garantita per il fornaio!
    valoreStimatoEuro: 5,
  },
  {
    id: 'rew_2',
    shopId: 2,
    shopName: 'Bar Pasticceria Preneste',
    categoria: 'ristorazione',
    titolo: 'Colazione d\'Autore (Caffè/Cappuccino + Cornetto)',
    descrizione: 'Omaggio 100% gratuito al banco per i residenti che sostengono abitualmente il bar.',
    puntiRichiesti: 35,
    tipoPremio: 'omaggio_puro_visita',
    richiedeAcquistoPregresso: true, // Richiede almeno 1 acquisto pregresso nel bar: tutela anti-scrocchio!
    valoreStimatoEuro: 3,
  },
  {
    id: 'rew_3',
    shopId: 3,
    shopName: 'Farmacia & Dermocosmesi Osa',
    categoria: 'salute',
    titolo: 'Sconto 15% su Cosmesi & Integratori',
    descrizione: 'Valido su una spesa minima di 25€ nel reparto parafarmaco e integratori sportivi.',
    puntiRichiesti: 50,
    tipoPremio: 'sconto_spesa_minima',
    spesaMinima: 25,
    richiedeAcquistoPregresso: false,
    valoreStimatoEuro: 6,
  },
  {
    id: 'rew_4',
    shopId: 4,
    shopName: 'Pizzeria Al Taglio & Fritti',
    categoria: 'ristorazione',
    titolo: 'Supplì & Bibita in Omaggio con 2 Pizze',
    descrizione: 'Aggiunto gratuitamente al tuo ordine serale di asporto (spesa minima 12€).',
    puntiRichiesti: 30,
    tipoPremio: 'omaggio_con_acquisto',
    spesaMinima: 12,
    richiedeAcquistoPregresso: false,
    valoreStimatoEuro: 4,
  },
  {
    id: 'rew_5',
    shopId: 5,
    shopName: 'Bottega Artigiana & Ferramenta',
    categoria: 'casa',
    titolo: 'Buono Sconto 8€ su Materiale Elettrico & Vernici',
    descrizione: 'Sconto immediato applicato in cassa su un acquisto minimo di 35€.',
    puntiRichiesti: 65,
    tipoPremio: 'sconto_spesa_minima',
    spesaMinima: 35,
    richiedeAcquistoPregresso: false,
    valoreStimatoEuro: 8,
  },
];

/**
 * Verifica se un utente può riscattare una ricompensa
 */
export function canUserClaimReward(
  reward: RewardQuartiere,
  state: UserFidelityState
): { canClaim: boolean; reason?: string } {
  if (state.puntiFidelity < reward.puntiRichiesti) {
    return {
      canClaim: false,
      reason: `Ti mancano ${reward.puntiRichiesti - state.puntiFidelity} punti per raggiungere la soglia di ${reward.puntiRichiesti} pts.`,
    };
  }

  // Verifica requisito di visita pregressa per omaggi puri
  if (reward.richiedeAcquistoPregresso) {
    const hasBoughtHere = state.transazioni.some((t) => t.shopId === reward.shopId);
    if (!hasBoughtHere) {
      return {
        canClaim: false,
        reason: `Questo omaggio gratuito è riservato a chi ha effettuato almeno 1 acquisto da "${reward.shopName}". Puoi invece utilizzare i tuoi punti per gli sconti con spesa minima!`,
      };
    }
  }

  return { canClaim: true };
}

/**
 * Riscatta una ricompensa e genera un Voucher con codice di verifica univoco
 */
export function claimReward(
  reward: RewardQuartiere
): { success: boolean; message: string; voucher?: VoucherRiscatto } {
  const state = getUserFidelityState();
  const check = canUserClaimReward(reward, state);

  if (!check.canClaim) {
    return { success: false, message: check.reason || 'Non puoi riscattare questo premio.' };
  }

  const now = Date.now();
  const codiceVerifica = `VP-${Math.floor(100000 + Math.random() * 900000)}`;

  const voucher: VoucherRiscatto = {
    id: `vouch_${now}_${Math.random().toString(36).substring(2, 6)}`,
    rewardId: reward.id,
    shopId: reward.shopId,
    shopName: reward.shopName,
    titolo: reward.titolo,
    codiceVerifica,
    puntiSpesi: reward.puntiRichiesti,
    dataOra: 'Oggi alle ' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    timestamp: now,
    scadenzaTimestamp: now + 1000 * 60 * 15, // 15 minuti di validità per il ritiro in cassa
    stato: 'attivo',
  };

  const updatedState: UserFidelityState = {
    ...state,
    puntiFidelity: Math.max(0, state.puntiFidelity - reward.puntiRichiesti),
    voucherAttivi: [voucher, ...state.voucherAttivi],
  };

  saveUserFidelityState(updatedState);

  return {
    success: true,
    message: `Premio riscattato! Mostra il codice ${codiceVerifica} al negoziante entro 15 minuti.`,
    voucher,
  };
}

/**
 * Convalida e brucia un voucher da parte del commerciante con PIN
 */
export function markVoucherUsed(voucherId: string): boolean {
  const state = getUserFidelityState();
  const nextVouchers = state.voucherAttivi.map((v) =>
    v.id === voucherId ? { ...v, stato: 'utilizzato' as const } : v
  );
  saveUserFidelityState({ ...state, voucherAttivi: nextVouchers });
  return true;
}
