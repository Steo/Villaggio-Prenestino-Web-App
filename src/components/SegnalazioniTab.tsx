import React, { useState } from 'react';
import { SegnalazioneCittadina, StatoSegnalazione } from '../types';
import {
  Camera,
  MapPin,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Share2,
  Sparkles,
  BellRing,
  ChevronDown,
  Mail,
  ThumbsUp,
} from 'lucide-react';
import { shareToWhatsApp } from '../utils/shareUtils';
import { compressMultipleImages } from '../utils/imageCompressor';
import { SegnalazioniSkeletonList } from './SkeletonLoaders';

interface SegnalazioniTabProps {
  segnalazioni: SegnalazioneCittadina[];
  mieSegnalazioni?: number[];
  segnalazioniVotate?: number[];
  onVoteSegnalazione?: (seg: SegnalazioneCittadina) => void;
  onSubmitSegnalazione: (data: {
    titolo: string;
    luogo: string;
    descrizione: string;
    foto: string[];
    nome?: string;
    telefono?: string;
  }) => Promise<void>;
  onOpenPhoto: (url: string) => void;
  onAdvanceSegnalazioneStato?: (id: number) => void;
  loading?: boolean;
}

export const SegnalazioniTab: React.FC<SegnalazioniTabProps> = ({
  segnalazioni,
  mieSegnalazioni = [],
  segnalazioniVotate = [],
  onVoteSegnalazione,
  onSubmitSegnalazione,
  onOpenPhoto,
  onAdvanceSegnalazioneStato,
  loading = false,
}) => {
  const [mostraForm, setMostraForm] = useState(false);
  const [filtroStato, setFiltroStato] = useState<number>(0);
  const [showIterInfo, setShowIterInfo] = useState(false);
  const [expandedSegDescIds, setExpandedSegDescIds] = useState<number[]>([]);

  const toggleSegDescExpanded = (id: number) => {
    setExpandedSegDescIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Wizard Step State (1: Problema & Foto, 2: Posizione GPS, 3: Riepilogo & Invio)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Field State
  const [titolo, setTitolo] = useState('');
  const [luogo, setLuogo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [nome, setNome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [foto, setFoto] = useState<string[]>([]);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviataSuccesso, setInviataSuccesso] = useState(false);
  const [ultimaSegnalazioneInviata, setUltimaSegnalazioneInviata] = useState<{
    luogo: string;
    titolo: string;
  } | null>(null);

  // GPS State
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const categorieRapide = [
    'Pericolo generico',
    'Illuminazione pubblica',
    'Rifiuti abbandonati',
    'Erba alta/verde pubblico',
    'Segnaletica',
    'Dissesto stradale',
    'Altro',
  ];

  // Gestione Scatto / Upload Foto con compressione automatica lato client (max 1280px, ~0.8 quality)
  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    if (foto.length + filesArray.length > 3) {
      alert('Puoi allegare al massimo 3 foto per segnalazione.');
      return;
    }

    setIsCompressingPhoto(true);
    try {
      // Compressione automatica su HTML5 canvas: risoluzione max 1280px e qualità JPEG 0.8
      // riduce il peso medio da 5-15 MB a 90-180 KB mantenendo nitidezza per cartelli, buche e decoro
      const compressedUrls = await compressMultipleImages(filesArray, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8,
        mimeType: 'image/jpeg',
      });
      setFoto((prev) => [...prev, ...compressedUrls]);
    } catch (err) {
      console.error('Errore durante la compressione immagine:', err);
      // Fallback a FileReader in caso di browser legacy
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFoto((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setIsCompressingPhoto(false);
      // Reset input value per permettere di ricaricare la stessa immagine se necessario
      e.target.value = '';
    }
  };

  const handleRimuoviFoto = (index: number) => {
    setFoto((prev) => prev.filter((_, i) => i !== index));
  };

  // Rilevamento GPS assistito
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsError('La geolocalizzazione non è supportata da questo browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsDetectingGps(false);
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(Math.round(accuracy));

        // Prova reverse geocoding via OpenStreetMap Nominatim gratuito
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'it' } }
          );
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || data.address?.pedestrian || 'Via di Villaggio Prenestino';
            const houseNumber = data.address?.house_number ? ` ${data.address.house_number}` : '';
            setLuogo(`${road}${houseNumber} (GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
            return;
          }
        } catch {
          // In caso di blocco di rete o offline, usa le coordinate GPS direttamente
        }

        setLuogo(`Villaggio Prenestino (GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
      },
      (error) => {
        setIsDetectingGps(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Permesso GPS negato. Digita la via manualmente nel campo sottostante.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Segnale GPS non disponibile al momento. Inserisci la via a mano.');
            break;
          case error.TIMEOUT:
            setGpsError('Tempo scaduto per il GPS. Riprova o scrivi la via.');
            break;
          default:
            setGpsError('Impossibile rilevare la posizione GPS. Scrivi l\'indirizzo.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  };

  // Navigazione Wizard
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!titolo.trim()) {
        alert('Seleziona o specifica il tipo di problema.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!luogo.trim()) {
        alert('Rileva la posizione col GPS oppure inserisci la via.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const resetForm = () => {
    setTitolo('');
    setLuogo('');
    setDescrizione('');
    setNome('');
    setTelefono('');
    setFoto([]);
    setCurrentStep(1);
    setGpsError(null);
    setGpsAccuracy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || !luogo.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitSegnalazione({
        titolo: titolo.trim(),
        luogo: luogo.trim(),
        descrizione: descrizione.trim(),
        foto,
        nome: nome.trim(),
        telefono: telefono.trim(),
      });
      setUltimaSegnalazioneInviata({
        titolo: titolo.trim(),
        luogo: luogo.trim(),
      });
      setInviataSuccesso(true);
      resetForm();
    } catch {
      alert('Errore nell\'invio della segnalazione. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareReportOnWhatsApp = (t: string, l: string) => {
    const msg = `⚠️ Nuova Segnalazione per Villaggio Prenestino:\n📌 Problema: ${t}\n📍 Luogo: ${l}\n\nL'Associazione di Quartiere sta raccogliendo e monitorando le problematiche del quartiere.`;
    shareToWhatsApp(msg, 'https://www.villaggioprenestino.it');
  };

  const segnalazioniFiltrate = segnalazioni.filter((s) => {
    const stMod = s.statoApprovazione || 'approvata';
    if (stMod !== 'approvata' && !mieSegnalazioni.includes(s.id)) {
      return false;
    }
    if (filtroStato === 0) return true;
    return s.s === filtroStato;
  });

  const getStatoBadge = (s: StatoSegnalazione) => {
    switch (s) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            1. Ricevuta
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
            <AlertCircle className="w-3 h-3 text-sky-700" />
            2. Inoltrata all'ente preposto
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            3. Risolta
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Banner informativo uniforme con divulgazione progressiva */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
                Segnalazioni & Decoro
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
                Segnalazioni Territoriali
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
                Invia e monitora disservizi, guasti e decoro a Villaggio Prenestino.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
              <button
                type="button"
                onClick={() => {
                  setMostraForm(!mostraForm);
                  if (inviataSuccesso) setInviataSuccesso(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {mostraForm ? <X className="w-4 h-4 text-slate-950" /> : <Camera className="w-4 h-4 text-slate-950" />}
                <span>{mostraForm ? 'Chiudi' : 'Nuova segnalazione'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIterInfo((prev) => !prev)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
                aria-expanded={showIterInfo}
              >
                <span>Come funziona</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showIterInfo ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Infografica espandibile: Come funziona la moderazione e l'iter delle Segnalazioni */}
          {showIterInfo && (
            <div className="mt-4 pt-4 border-t border-white/15 animate-fadeIn space-y-3">
              {/* Fase 1: Moderazione Volontari */}
              <div className="p-3 rounded-2xl bg-black/30 border border-amber-400/40 text-xs space-y-1.5 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Fase 1: Moderazione
                  </span>
                  <h4 className="font-bold text-amber-200">Verifica dai Volontari dell'Associazione</h4>
                </div>
                <p className="text-[11px] text-white/90 leading-relaxed">
                  Dopo l'invio, la segnalazione viene esaminata dai volontari dell'Associazione di Quartiere:
                </p>
                <ul className="list-disc list-inside text-[11px] text-white/85 space-y-1 pl-1">
                  <li>
                    <strong className="text-emerald-300">Se accettata:</strong> viene approvata, pubblicata nell'app e prende in carico l'iter a 3 stati descritto qui sotto.
                  </li>
                  <li>
                    <strong className="text-rose-300">Se rifiutata:</strong> l'utente riceve immediatamente una <strong>notifica</strong> con il messaggio di motivazione dell'amministratore.
                  </li>
                </ul>
              </div>

              {/* Fase 2: Iter 3 Stati dopo l'approvazione */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Fase 2: Iter a 3 Stati (Una volta approvata)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Stato 1 */}
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-amber-400/30 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mt-1 shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold text-amber-300">1. Ricevuta</strong>
                      <span className="text-[11px] text-white/85">Approvata e presa in carico dall'Associazione.</span>
                    </div>
                  </div>

                  {/* Stato 2 */}
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-sky-400/30 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold text-sky-300">2. Inoltrata</strong>
                      <span className="text-[11px] text-white/85">Trasmessa a Municipio VI, Polizia o AMA.</span>
                    </div>
                  </div>

                  {/* Stato 3 */}
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-emerald-400/30 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                    <div>
                      <strong className="block text-xs font-bold text-emerald-300">3. Risolta</strong>
                      <span className="text-[11px] text-white/85">Intervento verificato e completato.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PROCEDURA GUIDATA IN 3 PASSI */}
      {mostraForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500 p-4 sm:p-6 shadow-xl animate-scaleUp">
          {inviataSuccesso ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Segnalazione inviata con successo! (+5 Punti Civici)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                  Grazie per il tuo contributo al decoro del quartiere. L'Associazione prenderà in carico la segnalazione per l'inoltro agli organi competenti.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-semibold text-teal-800 dark:text-teal-200 shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Notifica email recapitata a <strong>associazione@villaggioprenestino.it</strong></span>
                </div>
              </div>

              {/* Tasto 1-Click Condivisione su WhatsApp del problema */}
              {ultimaSegnalazioneInviata && (
                <div className="pt-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() =>
                      handleShareReportOnWhatsApp(
                        ultimaSegnalazioneInviata.titolo,
                        ultimaSegnalazioneInviata.luogo
                      )
                    }
                    className="w-full min-h-[44px] py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Invia avviso al gruppo WhatsApp di quartiere</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setInviataSuccesso(false);
                  setMostraForm(false);
                }}
                className="text-xs text-slate-500 underline font-medium hover:text-slate-800"
              >
                Chiudi schermata
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Stepper Header visivo */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Procedura Rapida · Passo {currentStep} di 3
                  </span>
                  <span className="text-[11px] text-slate-400">Ottimizzata per Smartphone</span>
                </div>

                {/* Progress bar a 3 segmenti */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      currentStep >= 1 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                  <div
                    className={`h-2 rounded-full transition-all ${
                      currentStep >= 2 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                  <div
                    className={`h-2 rounded-full transition-all ${
                      currentStep >= 3 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* PASSO 1: Il Problema & Foto */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    Cosa è successo?
                  </h3>

                  {/* Scelta rapida categoria con touch targets generosi */}
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {categorieRapide.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setTitolo(cat)}
                          className={`min-h-[36px] text-xs px-3 py-1.5 rounded-xl border transition ${
                            titolo === cat
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 border-amber-400 font-bold shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={titolo}
                      onChange={(e) => setTitolo(e.target.value)}
                      placeholder="Oppure scrivi il problema (es. Buca profonda o perdita acqua)"
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Foto con fotocamera & compressione automatica */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Foto allegate ({foto.length}/3)</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Compressione veloce attiva
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {foto.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-18 h-18 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-2xs"
                        >
                          <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRimuoviFoto(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white cursor-pointer hover:bg-rose-600 transition"
                            title="Rimuovi foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {foto.length < 3 && (
                        <label className={`min-w-[76px] h-18 px-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 transition ${
                          isCompressingPhoto
                            ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-950/40 cursor-wait'
                            : 'border-amber-400/80 hover:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 active:scale-95 cursor-pointer'
                        }`}>
                          {isCompressingPhoto ? (
                            <>
                              <Loader2 className="w-4 h-4 text-amber-600 animate-spin mb-0.5" />
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Ottimizzo...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 text-amber-600 mb-0.5" />
                              <span className="text-[10px] font-bold">+ Foto</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            disabled={isCompressingPhoto}
                            onChange={handleFotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Descrizione facoltativa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Note o dettagli (facoltativo):
                    </label>
                    <textarea
                      rows={2}
                      value={descrizione}
                      onChange={(e) => setDescrizione(e.target.value)}
                      placeholder="Dettagli utili (es. davanti al civico 15)"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Tasto Avanti al Passo 2 */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="min-h-[42px] px-5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Avanti: Posizione</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2: Posizione & GPS */}
              {currentStep === 2 && (
                <div className="space-y-3 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    Dove si trova?
                  </h3>

                  {/* Box Rilevamento GPS Touch Rapido */}
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>Rilevamento GPS</span>
                      </h4>
                      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                        Rileva subito la via se ti trovi sul posto.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={isDetectingGps}
                      className="min-h-[38px] px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isDetectingGps ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Rilevamento...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Rileva GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {gpsAccuracy && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Posizione rilevata con precisione (±{gpsAccuracy}m).
                    </p>
                  )}

                  {gpsError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {gpsError}
                    </p>
                  )}

                  {/* Campo Indirizzo Modificabile */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Via o incrocio *:</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={luogo}
                      onChange={(e) => setLuogo(e.target.value)}
                      placeholder="es. Via Fosso dell'Osa o incrocio Via Specchia"
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Bottoni Navigazione Wizard */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Indietro</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="min-h-[44px] px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Avanti: Riepilogo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 3: Riepilogo & Conferma */}
              {currentStep === 3 && (
                <div className="space-y-3.5 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    Verifica e invia la segnalazione
                  </h3>

                  {/* Card di Riepilogo */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Problema:</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{titolo}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Luogo segnalato:</span>
                      <p className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {luogo}
                      </p>
                    </div>

                    {descrizione && (
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Note aggiuntive:</span>
                        <p className="text-slate-700 dark:text-slate-300">{descrizione}</p>
                      </div>
                    )}

                    {foto.length > 0 && (
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">
                          Foto allegate ({foto.length}):
                        </span>
                        <div className="flex gap-2">
                          {foto.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt="Anteprima"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dati facoltativi segnalatore */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                        Nome (facoltativo):
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Il tuo nome"
                        className="w-full min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                        Telefono (facoltativo):
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Per aggiornamenti"
                        className="w-full min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Pulsanti Azione Finale */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Modifica</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Invio in corso...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Conferma e Invia (+5 pts)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* FILTRI STATO: Su mobile verticale su 2 righe (Tutte e Ricevute sopra, Inoltrate e Risolte sotto), su tablet/desktop in riga unica */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setFiltroStato(0)}
          className={`w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl sm:rounded-full transition text-center shrink-0 flex items-center justify-center cursor-pointer ${
            filtroStato === 0
              ? 'bg-slate-950 text-white shadow-xs dark:bg-slate-100 dark:text-slate-950 font-black'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Tutte ({segnalazioni.length})
        </button>
        <button
          onClick={() => setFiltroStato(1)}
          className={`w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl sm:rounded-full transition text-center shrink-0 flex items-center justify-center cursor-pointer ${
            filtroStato === 1
              ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Ricevute ({segnalazioni.filter((s) => s.s === 1).length})
        </button>
        <button
          onClick={() => setFiltroStato(2)}
          className={`w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl sm:rounded-full transition text-center shrink-0 flex items-center justify-center cursor-pointer ${
            filtroStato === 2
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Inoltrate ({segnalazioni.filter((s) => s.s === 2).length})
        </button>
        <button
          onClick={() => setFiltroStato(3)}
          className={`w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl sm:rounded-full transition text-center shrink-0 flex items-center justify-center cursor-pointer ${
            filtroStato === 3
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Risolte ({segnalazioni.filter((s) => s.s === 3).length})
        </button>
      </div>

      {/* LISTA SEGNALAZIONI */}
      {loading ? (
        <SegnalazioniSkeletonList count={3} />
      ) : (
        <div className="space-y-3">
          {segnalazioniFiltrate.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              Nessuna segnalazione in questa sezione.
            </div>
          ) : (
          segnalazioniFiltrate.map((seg) => {
            const hasVoted = (segnalazioniVotate || []).includes(seg.id);
            return (
            <div
              key={seg.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatoBadge(seg.s)}
                  {mieSegnalazioni.includes(seg.id) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      La tua segnalazione
                    </span>
                  )}
                  {seg.statoApprovazione === 'in_attesa' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      ⏳ In attesa di approvazione
                    </span>
                  )}
                  {seg.statoApprovazione === 'rifiutata' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                      ❌ Non approvata
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{seg.data}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {seg.t}
                </h3>
                <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                  {seg.w}
                </p>
              </div>

              {seg.desc && (
                <div>
                  <p className={`text-xs text-slate-600 leading-relaxed ${
                    expandedSegDescIds.includes(seg.id) ? '' : 'line-clamp-2'
                  }`}>
                    {seg.desc}
                  </p>
                  {seg.desc.length > 90 && (
                    <button
                      type="button"
                      onClick={() => toggleSegDescExpanded(seg.id)}
                      className="text-[11px] font-bold text-amber-700 hover:underline mt-0.5 cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <span>{expandedSegDescIds.includes(seg.id) ? 'Mostra meno' : 'Leggi tutto'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${expandedSegDescIds.includes(seg.id) ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              )}

              {/* Pulsante di avanzamento stato per testare la notifica del browser */}
              {mieSegnalazioni.includes(seg.id) && onAdvanceSegnalazioneStato && (
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onAdvanceSegnalazioneStato(seg.id)}
                    title="Simula il passaggio di stato di questa tua segnalazione per testare l'avviso del browser"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 transition active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <BellRing className="w-3 h-3 text-sky-600" />
                    <span>Simula cambio stato segnalazione (Notifica)</span>
                  </button>
                </div>
              )}

              {/* Foto allegate */}
              {seg.ph && seg.ph.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {seg.ph.map((fotoUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onOpenPhoto(fotoUrl)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-zoom-in"
                    >
                      <img src={fotoUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Azioni Scheda: Tasto Conferma (+1) con micro-interazione e Condivisione */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={hasVoted}
                  onClick={() => {
                    try {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        navigator.vibrate([35]);
                      }
                    } catch {}
                    onVoteSegnalazione?.(seg);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
                    hasVoted
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default opacity-95 shadow-2xs animate-heartbeat'
                      : 'bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 cursor-pointer shadow-2xs hover:shadow-xs'
                  }`}
                  title={
                    hasVoted
                      ? 'Hai già confermato questa segnalazione (+1 registrato)'
                      : 'Conferma di aver riscontrato anche tu questo problema (+1 voto)'
                  }
                >
                  {hasVoted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 transition-transform scale-110" />
                      <span>Confermato ✓</span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-600 shrink-0 transition-transform" />
                      <span>Confermo (+1)</span>
                    </>
                  )}
                  {(seg.voti || 0) > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      hasVoted
                        ? 'bg-emerald-200/90 text-emerald-950'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {seg.voti}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleShareReportOnWhatsApp(seg.t, seg.w)}
                  title="Condividi sui gruppi WhatsApp del quartiere"
                  aria-label="Condividi segnalazione su WhatsApp"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          );
        })
        )}
      </div>
      )}
    </div>
  );
};
