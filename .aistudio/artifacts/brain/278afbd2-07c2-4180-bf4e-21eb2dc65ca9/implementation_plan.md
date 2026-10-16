# Piano di Implementazione: Pin Personalizzati Sagomati per la Mappa

Implementazione di un sistema di pin cartografici personalizzati e sagomati (custom teardrop / badge pin) su Google Maps per le attività commerciali e gli eventi di Villaggio Prenestino, con differenziazione cromatica per categoria, icone tematiche vettoriali ad alta risoluzione e stati interattivi (selezione, hover e offerta attiva).

---

## 1. Obiettivi e Scelte Condivise
- **Stile del Pin**: Pin sagomati a goccia moderna (*teardrop pin*) con corpo colorato, micro-ombra realistica, anello interno di contrasto e icona vettoriale/simbolo identificativo al centro.
- **Ambito di applicazione**: Sia alle **attività commerciali e negozi** che agli **eventi in programma**.
- **Coerenza cromatica**:
  - 🍞 **Alimentari**: Ambra / Arancio dorato (`#f59e0b` / `#d97706`) con icona shopping bag / store.
  - ☕ **Bar & Ristorazione**: Rosso rubino / Terracotta (`#dc2626` / `#b91c1c`) con icona posate / tazza.
  - 💊 **Salute & Farmacia**: Verde smeraldo (`#10b981` / `#059669`) con icona croce medica / salute.
  - 🔧 **Artigiani & Servizi**: Blu oltremare (`#3b82f6` / `#1d4ed8`) con icona chiave inglese / servizi.
  - 🏡 **Casa, Giardino & Brico**: Indaco / Viola (`#8b5cf6` / `#6d28d9`) con icona casa / martello.
  - 📅 **Eventi di Quartiere**: Porpora / Bordeaux Villaggio Prenestino (`#781816` / `#9333ea`) con icona calendario.

---

## 2. Esperienza Utente & Design Visivo
1. **Sagoma del Pin**:
   - Elemento grafico SVG / HTML renderizzato all'interno di `<AdvancedMarker>` di `@vis.gl/react-google-maps`.
   - Dimensioni ottimali: `36px × 44px` (stato normale), scalato a `44px × 54px` con elevazione z-index quando selezionato o toccato.
   - Punta inferiore affilata e centrata sul punto esatto di coordinate GPS.
2. **Badge Speciale "Offerta Attiva"**:
   - Per le attività con una promozione residenti attiva, viene mostrato un micro-badge scintillante con fiamma/stella nell'angolo superiore del pin, così da evidenziare a colpo d'occhio i negozi con sconti attivi.
3. **Interazione & Accessibilità**:
   - Clic / tap sul pin apre l'InfoWindow dettagliata dell'attività o dell'evento con transizione fluida.
   - Tooltip nativo con il nome dell'attività all'hover su desktop.
   - Animazione di rimbalzo delicata (`animate-bounce` breve o transizione `scale-110`) al momento della selezione.

---

## 3. Dettagli di Implementazione Tecnica

### A. Componente `CustomMapPin.tsx`
Creazione di un componente dedicato `CustomMapPin` che genera il pin sagomato SVG:
- Proprietà:
  - `categoria`: `'alimentari' | 'ristorazione' | 'salute' | 'servizi' | 'casa' | 'evento'`
  - `isSelected`: boolean
  - `hasOffer`: boolean
  - `label`: string (accessibilità)
  - `icon`: icona Lucide o glifo dedicato (es. `Utensils`, `Store`, `HeartPulse`, `Wrench`, `Home`, `Calendar`)

### B. Integrazione in `MappaQuartiere.tsx`
- Sostituzione dei generici `<Pin>` standard con `<CustomMapPin>` all'interno dei componenti `<AdvancedMarker>` per le attività commerciali e gli eventi.
- Sincronizzazione automatica con i filtri già presenti sulla mappa (filtro per categoria e filtro negozi/eventi).

---

## 4. Piano di Verifica e Test
1. **Verifica Visiva su Google Maps**:
   - Verificare che i pin siano centrati correttamente con la punta sul punto geografico.
   - Controllare la resa grafica sia su sfondo mappa chiaro che su mappa notturna/satellite.
   - Verificare la corretta assegnazione dei colori e delle icone per tutte le 5 categorie merceologiche e per gli eventi.
2. **Verifica Interattiva**:
   - Cliccare su ciascun pin per confermare l'apertura della scheda InfoWindow.
   - Verificare che il pin selezionato aumenti di dimensione e risalti visivamente rispetto agli altri.
   - Verificare il filtro categoria in tempo reale (i pin non corrispondenti scompaiono fluidamente).
3. **Compilazione & Lint**:
   - Eseguire `lint_applet` e `compile_applet` per assicurare zero regressioni di tipi TypeScript o errori di bundling.
