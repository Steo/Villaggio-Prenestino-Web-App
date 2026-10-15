# Piano di Implementazione: Usabilità Mobile, Condivisione WhatsApp & Segnalazioni Rapide in 3 Passi

In base alle tue risposte e alle esigenze di quartiere per **Villaggio Prenestino**, implementeremo tre macro-miglioramenti per rendere la web app immediata su smartphone e facilmente condivisibile sui gruppi WhatsApp di zona.

---

### Obiettivi Chiave

1. **Condivisione 1-Click su WhatsApp di Zona**:
   - Aggiunta di un pulsante dedicato verde con icona WhatsApp ("Condividi su WhatsApp" / "Invia a un gruppo di quartiere") su tutte le schede chiave: **Notizie**, **Eventi**, **Richieste di volontariato**, e **Segnalazioni**.
   - Generazione di un testo ben formattato con emoji adatte (es. `📢 Notizia CdQ Villaggio Prenestino: [Titolo]... Leggi e partecipa: [Link]`) che apre direttamente l'app WhatsApp (`https://api.whatsapp.com/send?text=...`) oppure sfrutta la Web Share API nativa di sistema.
   - Opzione per copiare il testo formattato con notifica visiva (toast) nel caso in cui WhatsApp non si apra direttamente.

2. **Installazione PWA Guidata su Smartphone (Senza Store)**:
   - Configurazione completa del Web App Manifest (`public/manifest.webmanifest`) con icone, nome *"CdQ Villaggio Prenestino"*, theme-color `#781816` e display standalone.
   - Implementazione di un Service Worker essenziale (`public/sw.js`) per il caching offline delle risorse base (logo, stili, guscio app) e registrazione in `src/main.tsx`.
   - Componente **Banner & Guida Installazione PWA (`src/components/PwaInstallBanner.tsx`)**:
     - Su Android / Chrome: intercetta l'evento nativo `beforeinstallprompt` e mostra il pulsante *"Installa l'App sul telefono"* con 1 tocco.
     - Su iOS / Safari: mostra una mini-guida grafica a scomparsa (*"Tocca Condividi ⎋ in basso e scegli 'Aggiungi alla schermata Home ⊞'"*).
     - Riconoscimento se l'app è già in modalità standalone (evitando di mostrare il banner a chi ha già installato l'app).

3. **Procedura Guidata Rapida Segnalazioni in 3 Passi (Wizard con Foto e GPS)**:
   - Sostituzione del form unico con un wizard a passaggi chiarissimo e comodo con il pollice:
     - **Passo 1 — Il Problema & Foto**: Categoria rapida (Buca stradale, Lampione spento, Rifiuti, Verde/Erba, Segnaletica, Altro) + Scatto foto con fotocamera o allegato da galleria (fino a 3 foto) + breve descrizione.
     - **Passo 2 — Posizione con GPS**: Pulsante ad alta visibilità *"Rileva la mia posizione GPS"* con coordinate automatiche e geocoding inverso di quartiere + input editabile per via/civico esatto.
     - **Passo 3 — Riepilogo & Conferma**: Scheda di riepilogo pulita per verificare foto, posizione e recapito prima dell'invio.
   - Notifica di successo immediata con assegnazione punti civici (+5 pts) e pulsante *"Condividi segnalazione su WhatsApp"* per informare i residenti o il comitato.

---

### File Coinvolti e Modifiche

1. **`public/manifest.webmanifest` & `public/sw.js`**:
   - Creazione del manifest PWA con icone, nome, colori e orientamento.
   - Service worker con strategie di cache per asset statici e gestione offline.

2. **`index.html`**:
   - Aggiunta dei tag `<link rel="manifest" href="/manifest.webmanifest">` e meta tag specifici per Apple Web App (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`).

3. **`src/utils/shareUtils.ts` (Nuovo)**:
   - Utility riutilizzabile per formattare e inviare contenuti direttamente su WhatsApp o via Web Share API.

4. **`src/components/PwaInstallBanner.tsx` (Nuovo)**:
   - Banner touch-friendly per l'installazione PWA guidata su Android e iPhone.

5. **`src/components/SegnalazioniTab.tsx`**:
   - Integrazione della procedura guidata a 3 passi con step indicator, geolocalizzazione GPS `navigator.geolocation`, anteprima fotografica e pulsante rapido di condivisione WhatsApp post-invio.

6. **`src/components/HomeTab.tsx` & `src/components/EventiTab.tsx`**:
   - Integrazione dell'azione diretta WhatsApp 1-click su ogni evento e notizia.

7. **`src/App.tsx` & `src/main.tsx`**:
   - Registrazione Service Worker e inclusione del banner di installazione PWA non invasivo.

---

### Verifica e Collaudo

1. Compilazione TypeScript completa senza errori (`compile_applet`).
2. Verifica su desktop e mobile del banner PWA e della risposta responsive.
3. Test della geolocalizzazione e del flusso a 3 step delle segnalazioni.
4. Verifica della corretta generazione degli URL WhatsApp.
