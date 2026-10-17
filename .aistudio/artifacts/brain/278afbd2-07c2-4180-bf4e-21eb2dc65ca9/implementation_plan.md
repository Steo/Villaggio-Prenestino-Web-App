# Piano di Semplificazione UX e Sintesi Testi dell'Applicazione

Piano dettagliato per snellire l'interfaccia utente, ridurre il carico cognitivo ed eliminare i blocchi di testo ridondanti nell'applicazione, con priorità su **Scheda Commercio & Registrazione Attività** e **Scheda Segnalazioni & Form Guidato**, implementando la tecnica della **divulgazione progressiva** (*progressive disclosure*: testi essenziali visibili subito, approfondimenti espandibili su richiesta).

---

## 1. Analisi delle Criticità Attuali e Obiettivi UX

### Criticità Riscontrate:
1. **Hero Banner troppo carichi di testo descrittivo**: Sia in Commercio che in Segnalazioni, la parte superiore della schermata è occupata da lunghi paragrafi esplicativi e infografiche che spingono verso il basso i contenuti operativi (mappa, vetrina negozi, form di invio).
2. **Form di inserimento con doppie spiegazioni**: I campi modulo contengono sia etichette estese che lunghi paragrafi di istruzioni (es. spiegazioni sul formato JPG, sull'orario spezzato, sulla moderazione amministratore) che allungano lo scroll verticale da mobile.
3. **Card con testi lunghi non formattati**: Descrizioni delle attività commerciali e delle segnalazioni occupano molto spazio visivo senza un meccanismo compatto di anteprima/espansione (*"Leggi tutto"*).
4. **Sovrabbondanza di note e avvisi informativi**: Ripetizione di chiarimenti procedurali che possono essere racchiusi in modali/tooltip discreti o accordion richiudibili.

### Obiettivi:
- **Immediatezza visiva**: L'utente deve poter agire (cercare un negozio, consultare la mappa, inviare una segnalazione) entro 2 secondi dall'apertura della tab.
- **Divulgazione Progressiva**: Mostrare 1-2 frasi chiave per contestualizzare, offrendo pulsanti discreti come *"Come funziona? (Dettagli)"* o *"Linee guida"* per chi desidera approfondire senza appesantire la UI per gli utenti abituali.
- **Micro-copy orientato all'azione**: Sostituire spiegazioni prolisse con badge compatti, icone semantiche e placeholder esplicativi nei campi di input.

---

## 2. Dettaglio Interventi: Scheda Commercio e Form Registrazione

### A. Hero Banner & Selettori di Vista
- **Hero Banner compatto**:
  - Titolo chiaro: *"Commercio di Quartiere"*.
  - Sottotitolo sintetico (1 riga): *"Sostieni le attività e i negozi di vicinato di Villaggio Prenestino."*
  - Elemento espandibile discreto: *"Come iscriversi o gestire la propria scheda ▾"* che, al tocco, mostra in un micro-accordion i dettagli sui vantaggi e sulla gratuità.
  - CTA primaria rapida: *"Iscrivi attività"* (bottone compatto con icona).
- **Barra Mappa & Vetrina**:
  - Riduzione delle altezze dei selettori; uniformazione immediata dei filtri con dicitura univoca *"Categoria"*.

### B. Vetrina Negozi & Card Commercianti
- **Card Negozi snelle**:
  - Intestazione con Logo/Foto a sinistra o in testata compatta, nome, badge di categoria colorato e stato apertura immediato (*"Aperto"* / *"Chiuso"*).
  - Descrizione limitata a 2 righe con sfumatura e pulsante inline *"Mostra altro / Meno"* per testi prolissi.
  - Orari e contatti raggruppati in una barra icone compatta (Telefono, WhatsApp diretto, Mappa, Promo).
  - Tasto titolare compatto e pulito: *"Gestisci con PIN"*.

### C. Modale di Registrazione Attività Commerciale
- **Header del Modale**:
  - Rimozione del blocco descrittivo introduttivo di 4 righe. Sostituzione con badge di stato compatto: *"Iscrizione Gratuita • Moderazione Rapida"*.
- **Area Foto/Logo (.JPG)**:
  - Eliminazione delle 3 righe di testo descrittivo.
  - Riquadro di upload compatto con icona fotocamera, anteprima immediata e label essenziale: *"Foto o Logo (.jpg)"*.
- **Configuratore Orari Standardizzato**:
  - Snellite le istruzioni: via il testo esplicativo, mantenimento dei preset rapidi (*"Lun-Sab"*, *"Tutti i giorni"*, *"Lun-Ven"*) e selettori orario compatti.
- **Schermata di Conferma Invio (In moderazione)**:
  - Presentazione visiva a 3 step orizzontale compatto invece di card verticali ingombranti, con pulsante primario chiaro *"Ho capito / Chiudi"*.

---

## 3. Dettaglio Interventi: Scheda Segnalazioni e Form Guidato

### A. Hero Banner & Infografica 3 Stati
- **Banner compatto**:
  - Titolo essenziale: *"Segnalazioni Territoriali"*.
  - Sottotitolo: *"Invia e monitora disservizi, guasti e decoro a Villaggio Prenestino."*
  - CTA rapida: *"Nuova Segnalazione"* con icona fotocamera.
  - **Infografica dei 3 Stati (Ricevuta, Inoltrata, Risolta)**: trasformata in un drawer/accordion compatto con toggle *"Come funziona l'iter di gestione (3 stati) ▾"*, visualizzato solo se l'utente richiede spiegazioni, risparmiando oltre 200px di altezza su mobile.

### B. Wizard di Inserimento in 3 Passi
- **Passo 1 (Cosa è successo?)**:
  - Riduzione delle didascalie: chip di categoria frequente (es. *"Buca"*, *"Lampione"*, *"Rifiuti"*, *"Verde"*) a tocco singolo.
  - Campo titolo con placeholder chiaro; campo foto compatto con pulsante fotocamera immediato; campo descrizione con placeholder esplicativo senza testi di contorno superflui.
- **Passo 2 (Posizione & GPS)**:
  - Box GPS sintetico: pulsante ben visibile *"Rileva con GPS"* che compila istantaneamente la via, evitando testi ridondanti sul funzionamento del browser.
  - Campo indirizzo pulito.
- **Passo 3 (Riepilogo & Invio)**:
  - Tabella di riepilogo a badge compatti (Categoria, Indirizzo, Foto allegate).
  - Campi nome/telefono raggruppati con etichette sintetiche: *"Nome (facoltativo)"*, *"Telefono (facoltativo)"*.

### C. Feed delle Segnalazioni
- **Card Segnalazione ottimizzata**:
  - Badge di stato compatto e data in testata.
  - Titolo in evidenza con indirizzo su riga singola con icona pin.
  - Testo descrizione con troncamento automatico dopo 2 righe ed espansione on-demand (*"Leggi tutto"*).
  - Galleria foto con miniature orizzontali compatte apribili a tutto schermo al tap.

---

## 4. Architettura dei Componenti & Pattern di Codice

```
┌────────────────────────────────────────────────────────┐
│                   CommercioTab                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Hero Banner Compatto + Accordion "Come funziona" │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Vetrina: Card con preview testo + "Leggi tutto"  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Modale Registrazione: Campi diretti, zero slop   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                 SegnalazioniTab                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Hero Banner + Toggle "Iter dei 3 stati ▾"        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Wizard a 3 step snello (Foto rapida, GPS 1-tap)  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Feed: Card sintetiche con espansione controllata │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 5. File Coinvolti e Piano di Esecuzione

1. **`src/components/CommercioTab.tsx`**:
   - Ristrutturazione dell'hero banner con pillole sintetiche e testo riassunto.
   - Aggiunta stato collassabile `showInfoDetails` per le istruzioni estese.
   - Snellimento del modale di registrazione: rimozione istruzioni ridondanti sui campi, compattazione dell'upload foto JPG e del selettore orari.
   - Troncamento descrizioni negozi con toggle compatto *"Mostra tutto / Riduci"*.

2. **`src/components/SegnalazioniTab.tsx`**:
   - Compattazione dell'hero banner e conversione dell'infografica sui 3 stati in sezione espandibile on-demand.
   - Semplificazione del wizard in 3 passi (micro-copy essenziale, rimozione testi descrittivi nei singoli passaggi a favore di placeholder parlanti).
   - Card del feed segnalazioni con troncamento intelligente delle descrizioni lunghe.

3. **Verifica & Collaudo**:
   - Verifica conformità TypeScript con `lint_applet` e `compile_applet`.
   - Verifica dell'adattabilità responsive su schermi mobile (360px - 414px) e desktop.
