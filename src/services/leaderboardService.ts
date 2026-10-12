export interface CittadinoAttivo {
  id: string;
  nome: string;
  punti: number;
  badge: string;
  livello: 'Nuovo Vicino' | 'Vicino Attivo' | 'Pilastro' | 'Custode';
  attivitaPrincipale: string;
  isCurrentUser?: boolean;
  avatarBg?: string;
}

const LEADERBOARD_KEY = 'vp_cittadini_classifica';

// All'avvio dell'applicazione la classifica è VUOTA (zero profili fittizi).
// Si popolerà dinamicamente e in tempo reale con l'utilizzo da parte dei cittadini.
export const DEFAULT_COMMUNITY_CITIZENS: Omit<CittadinoAttivo, 'isCurrentUser'>[] = [];

// Lista dei vecchi dati mock di sviluppo da rimuovere automaticamente
const LEGACY_MOCK_NAMES = ['Roberto S.', 'Elena V.', 'Marco R.', 'Giulia T.', 'Davide M.', 'Chiara B.'];
const LEGACY_MOCK_IDS = ['cit_1', 'cit_2', 'cit_3', 'cit_4', 'cit_5', 'cit_6'];

export function getCalcolatoLivello(punti: number): {
  livello: 'Nuovo Vicino' | 'Vicino Attivo' | 'Pilastro' | 'Custode';
  badge: string;
} {
  if (punti >= 150) return { livello: 'Custode', badge: '⭐' };
  if (punti >= 80) return { livello: 'Pilastro', badge: '🏛️' };
  if (punti >= 30) return { livello: 'Vicino Attivo', badge: '🤝' };
  return { livello: 'Nuovo Vicino', badge: '🌱' };
}

export function getStoredCommunityCitizens(): Omit<CittadinoAttivo, 'isCurrentUser'>[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Elimina residui di profili fittizi di test
        const puliti = parsed.filter(
          (c) =>
            c &&
            typeof c.punti === 'number' &&
            c.punti > 0 &&
            c.nome &&
            !LEGACY_MOCK_IDS.includes(c.id) &&
            !LEGACY_MOCK_NAMES.includes(c.nome)
        );
        if (puliti.length !== parsed.length) {
          saveStoredCommunityCitizens(puliti);
        }
        return puliti;
      }
    }
  } catch (e) {
    console.error('Errore nel recupero della classifica salvata in locale:', e);
  }
  return [];
}

export function saveStoredCommunityCitizens(citizens: Omit<CittadinoAttivo, 'isCurrentUser'>[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(citizens));
  } catch (e) {
    console.error('Errore nel salvataggio della classifica in locale:', e);
  }
}

/**
 * Sincronizza la classifica locale con quella restituita dall'API REST di WordPress
 */
export function syncRemoteLeaderboard(remoteCitizens: any[]): void {
  if (!Array.isArray(remoteCitizens)) return;
  const valid: Omit<CittadinoAttivo, 'isCurrentUser'>[] = remoteCitizens
    .filter((c) => c && typeof c.punti === 'number' && c.punti > 0 && c.nome)
    .map((c) => {
      const punti = Number(c.punti);
      const calc = getCalcolatoLivello(punti);
      return {
        id: String(c.id || `cit_rem_${Math.random()}`),
        nome: String(c.nome),
        punti,
        badge: c.badge || calc.badge,
        livello: c.livello || calc.livello,
        attivitaPrincipale: c.attivitaPrincipale || 'Cittadino attivo',
        avatarBg: c.avatarBg || 'bg-slate-600',
      };
    });
  saveStoredCommunityCitizens(valid);
}

export interface LeaderboardResult {
  top5: CittadinoAttivo[];
  fullRanking: CittadinoAttivo[];
  currentUserRank: number;
  currentUserEntry: CittadinoAttivo;
  pointsToTop5: number;
  pointsToNext: number;
  totalCitizens: number;
}

export function getFullLeaderboard(
  userPunti: number,
  userName?: string
): LeaderboardResult {
  const communityList = getStoredCommunityCitizens();
  const { livello: userLivello, badge: userBadge } = getCalcolatoLivello(userPunti);

  const currentUserEntry: CittadinoAttivo = {
    id: 'current_user',
    nome: userName && userName.trim() ? userName.trim() : 'Tu (Questo dispositivo)',
    punti: userPunti,
    badge: userBadge,
    livello: userLivello,
    attivitaPrincipale: userPunti > 0 ? 'Cittadino partecipe' : 'In attesa della prima azione',
    isCurrentUser: true,
    avatarBg: 'bg-[#781816]',
  };

  const allCitizens: CittadinoAttivo[] = [
    ...communityList.map((c) => ({ ...c, isCurrentUser: false })),
  ];

  // L'utente entra formalmente in classifica non appena accumula punti (> 0)
  if (userPunti > 0) {
    allCitizens.push(currentUserEntry);
  }

  // Ordina per punti decrescenti
  allCitizens.sort((a, b) => b.punti - a.punti);

  const userIndex = allCitizens.findIndex((c) => c.isCurrentUser);
  const currentUserRank = userIndex !== -1 ? userIndex + 1 : 0;
  const top5 = allCitizens.slice(0, 5);

  // Calcolo punti necessari per entrare in Top 5 o superare il precedente
  let pointsToTop5 = 0;
  if (currentUserRank > 5 && allCitizens.length >= 5) {
    const fifth = allCitizens[4];
    pointsToTop5 = Math.max(1, fifth.punti - userPunti + 1);
  }

  let pointsToNext = 0;
  if (currentUserRank > 1) {
    const personAbove = allCitizens[currentUserRank - 2];
    pointsToNext = Math.max(1, personAbove.punti - userPunti + 1);
  }

  return {
    top5,
    fullRanking: allCitizens,
    currentUserRank,
    currentUserEntry,
    pointsToTop5,
    pointsToNext,
    totalCitizens: allCitizens.length,
  };
}
