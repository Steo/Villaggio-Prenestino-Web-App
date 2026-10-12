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

export const DEFAULT_COMMUNITY_CITIZENS: Omit<CittadinoAttivo, 'isCurrentUser'>[] = [
  {
    id: 'cit_1',
    nome: 'Roberto S.',
    punti: 165,
    badge: '⭐',
    livello: 'Custode',
    attivitaPrincipale: 'Cura del verde & parchi',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'cit_2',
    nome: 'Elena V.',
    punti: 130,
    badge: '🏛️',
    livello: 'Pilastro',
    attivitaPrincipale: 'Eventi & accoglienza',
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'cit_3',
    nome: 'Marco R.',
    punti: 95,
    badge: '🏛️',
    livello: 'Pilastro',
    attivitaPrincipale: 'Decoro urbano & segnalazioni',
    avatarBg: 'bg-sky-600',
  },
  {
    id: 'cit_4',
    nome: 'Giulia T.',
    punti: 60,
    badge: '🤝',
    livello: 'Vicino Attivo',
    attivitaPrincipale: 'Iniziative solidali & libri',
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'cit_5',
    nome: 'Davide M.',
    punti: 45,
    badge: '🤝',
    livello: 'Vicino Attivo',
    attivitaPrincipale: 'Supporto logistico assemblee',
    avatarBg: 'bg-rose-600',
  },
  {
    id: 'cit_6',
    nome: 'Chiara B.',
    punti: 25,
    badge: '🌱',
    livello: 'Nuovo Vicino',
    attivitaPrincipale: 'Mobilità & viabilità',
    avatarBg: 'bg-teal-600',
  },
];

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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Errore nel recupero della classifica salvata in locale:', e);
  }
  // Se non presente, salva i dati iniziali di comunità
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_COMMUNITY_CITIZENS));
  } catch {}
  return DEFAULT_COMMUNITY_CITIZENS;
}

export function saveStoredCommunityCitizens(citizens: Omit<CittadinoAttivo, 'isCurrentUser'>[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(citizens));
  } catch (e) {
    console.error('Errore nel salvataggio della classifica in locale:', e);
  }
}

export interface LeaderboardResult {
  top5: CittadinoAttivo[];
  fullRanking: CittadinoAttivo[];
  currentUserRank: number;
  currentUserEntry: CittadinoAttivo;
  pointsToTop5: number;
  pointsToNext: number;
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
    attivitaPrincipale: 'Cittadino partecipe',
    isCurrentUser: true,
    avatarBg: 'bg-[#781816]',
  };

  // Unione lista locale e utente corrente
  const allCitizens: CittadinoAttivo[] = [
    ...communityList.map((c) => ({ ...c, isCurrentUser: false })),
    currentUserEntry,
  ];

  // Ordina per punti decrescenti
  allCitizens.sort((a, b) => b.punti - a.punti);

  const currentUserRank = allCitizens.findIndex((c) => c.isCurrentUser) + 1;
  const top5 = allCitizens.slice(0, 5);

  // Calcolo punti necessari per entrare in Top 5 o superare il precedente
  let pointsToTop5 = 0;
  if (currentUserRank > 5) {
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
  };
}
