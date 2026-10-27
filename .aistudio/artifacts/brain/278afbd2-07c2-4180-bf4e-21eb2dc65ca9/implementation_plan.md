# Gestione Dinamica 'Custodi dei Parchi' con Attivazione su Carenza

Sistema integrato nella sezione Volontari per gestire i turni di apertura al **Mattino** e chiusura alla **Sera** dei parchi di quartiere gestiti dall'Associazione. L'amministratore può gestire una lista espandibile di parchi (inizialmente **"Giardino 25 Novembre"** e **"Parco di Via Riserva Nuova"**) e attivare l'appello di carenza volontari in modo indipendente per ciascun parco.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Revisione aggiornata in base alle tue precise indicazioni:

- **Attività Focalizzata Esclusivamente su Apertura e Chiusura**: Rimossi totalmente tutti i riferimenti allo svuotamento dei cestini. L'attività consiste unicamente nell'apertura al **Mattino** e nella chiusura alla **Sera**.
- **Nomenclatura Turni Rigorosa**: Utilizzo esclusivo della terminologia **"Mattino"** (apertura cancelli) e **"Sera"** (chiusura cancelli). Nessun riferimento ad alba o tramonto.
- **Parchi Preconfigurati & Nomi Reali**:
  1. **Giardino 25 Novembre**
  2. **Parco di Via Riserva Nuova**
- **Gestione Dinamica della Lista Parchi (Admin)**: L'amministratore può:
  - Aggiungere nuovi parchi o aree verdi in gestione (nome, indirizzo/riferimento, note operative).
  - Attivare o disattivare la richiesta di carenza volontari in modo **indipendente per singolo parco** (es. attivare l'appello solo per il Giardino 25 Novembre se l'altro è già coperto, o viceversa).
  - Specificare quanti volontari mancano per il turno del Mattino e quanti per il turno della Sera.
- **Visualizzazione nella Sezione Volontari**: Quando la carenza è attiva per uno o più parchi, ciascun parco attivo compare nella lista delle attività di volontariato con contrassegno di urgenza, permettendo al cittadino di candidarsi per il **Mattino**, per la **Sera** o per **Entrambi**.

---

### 1. Overview & Core Concept

- **Cosa fa**: Mantiene un registro dinamico dei parchi in gestione all'Associazione. Per ogni parco, l'amministratore controlla lo stato della copertura per i cancelli: se ci sono volontari a sufficienza l'appello rimane nascosto; se si verifica una carenza di personale, l'amministratore attiva la richiesta con un click per quel singolo parco.
- **Destinatari**:
  - *Cittadini & Volontari*: Residenti nelle vicinanze dei parchi disponibili per l'apertura mattutina o per la chiusura serale.
  - *Amministratori / Referenti Parchi*: Gestori dell'Associazione che possono monitorare le adesioni, aggiungere nuove aree verdi e lanciare appelli mirati solo quando serve.
- **Valore Civico**: Garantisce che i cancelli dei parchi vengano aperti e chiusi con regolarità 365 giorni l'anno per la sicurezza e la fruizione di famiglie e bambini, senza assuefare la comunità con richieste permanenti quando i turni sono già coperti.

---

### 2. User Experience & Visual Design

#### A. Flusso Utente (Cittadino nella Scheda Volontariato)
1. **Visualizzazione Richiesta Attiva**: Se l'amministratore ha attivato la carenza per uno o più parchi, compare la card dedicata con contrassegno *Urgente*:
   - *"Custodi del Parco: Giardino 25 Novembre"*
   - *"Custodi del Parco: Parco di Via Riserva Nuova"*
2. **Dettaglio Attività**: La card specifica in modo chiaro ed essenziale i compiti:
   - ☀️ **Turno Mattino**: Apertura cancelli.
   - 🌙 **Turno Sera**: Chiusura cancelli.
   - Luogo preciso e contatore di volontari aderiti rispetto al fabbisogno impostato dall'amministratore.
3. **Candidatura Immediata**:
   - Cliccando su *"Partecipa"*, il modal consente di indicare la propria preferenza di turno:
     - 🔘 *Solo Mattino (Apertura)*
     - 🔘 *Solo Sera (Chiusura)*
     - 🔘 *Entrambi i turni*
     - Eventuali giorni della settimana di disponibilità (es. lun-ven, weekend, tutti i giorni).
4. **Conferma & Contatto Diretto**: Al salvataggio, il contatore si aggiorna e viene offerto il pulsante WhatsApp per contattare direttamente il referente parchi per la consegna chiavi o istruzioni.

#### B. Flusso Amministratore (Pannello Gestione Parchi)
1. Nella sezione di amministrazione è presente il blocco **"Parchi in Gestione & Turni"**.
2. **Lista Parchi Esistenti**:
   - Scheda per *Giardino 25 Novembre*:
     - Interruttore rapido: *Carenza Volontari: [Disattivata] / [ATTIVA]*
     - Volontari necessari: selettore per numero persone necessarie (default: 2 al Mattino, 2 alla Sera).
   - Scheda per *Parco di Via Riserva Nuova*: medesimi controlli indipendenti.
3. **Pulsante "+ Aggiungi Nuovo Parco"**:
   - Form compatto per inserire un nuovo parco (Nome del parco, Indirizzo/Via, Note di gestione per le chiavi/lucchetti).
   - Il nuovo parco entra immediatamente nella lista e può essere attivato/disattivato al bisogno.

#### C. Visual Identity & Styling
- **Anti-Slop Discipline**: Nessuna pill decorativa statica. Solo chiara gerarchia tipografica con titoli netti, testo pulito con separatori `·` e badge d'urgenza minimale ad alto contrasto.
- **Tonalità Istituzionali**: Verde bosco scuro (`emerald-700`/`teal-800`), bordeaux civico (`#781816`) e ambra per l'urgenza, in perfetta armonia con il resto della piattaforma.
- **Accessibilità**: Contrasto verificato AA/AAA su temi chiaro e scuro; touch targets ampi per l'utilizzo rapido su smartphone.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisione 1: Focus esclusivo su Apertura e Chiusura**
  - *Scelta*: Esclusione di qualsiasi riferimento allo svuotamento dei cestini o ad altre mansioni operative.
  - *Motivazione*: Allineamento rigoroso alle richieste: l'attività si limita alla custodia dei cancelli (Mattino/Sera), rendendo l'impegno leggero e chiaro per chi si candida.

- **Decisione 2: Gestione multi-parco dinamica vs Lista cablata fissa**
  - *Scelta*: Memorizzare la lista dei parchi in uno stato configurabile (con default *Giardino 25 Novembre* e *Parco di Via Riserva Nuova*), con funzione di aggiunta nuovi parchi da interfaccia amministratore.
  - *Motivazione*: Consente all'Associazione di gestire ulteriori aree verdi che dovessero essere affidate in futuro.

- **Decisione 3: Attivazione per singolo parco vs Interruttore globale**
  - *Scelta*: Ciascun parco ha il proprio interruttore di carenza indipendente.
  - *Motivazione*: Permette di lanciare l'appello solo per il parco in cui mancano effettivamente persone, senza allarmare inutilmente dove i turni sono coperti.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PANNELLO AMMINISTRATORE                           │
│  - Gestione lista parchi dinamica:                                     │
│    * [Giardino 25 Novembre]   -> Toggle: [CARENZA ATTIVA / COPERTO]    │
│    * [Parco Via Riserva Nuova] -> Toggle: [CARENZA ATTIVA / COPERTO]    │
│    * [+ Aggiungi altro parco...]                                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Aggiorna LocalStorage / WP Data
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PARK SERVICE & STORAGE                          │
│  parksConfig: [                                                        │
│    { id: 'p1', nome: 'Giardino 25 Novembre', carenzaAttiva: true, ...} │
│    { id: 'p2', nome: 'Parco di Via Riserva Nuova', carenzaAttiva: ... }│
│  ]                                                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Genera/Filtra richieste
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        VolontariatoTab                                 │
│  Per ogni parco con 'carenzaAttiva === true':                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Card Volontariato Parco (Badge 'Urgente')                        │  │
│  │ - "Custodi del Parco: Giardino 25 Novembre"                     │  │
│  │ - Mansione: Apertura Mattino · Chiusura Sera                     │  │
│  │ - Volontari aderiti / necessari                                  │  │
│  │ - [ Tasto: Partecipa e scegli turno (Mattino / Sera) ]           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Modello Dati Tipizzato:
```typescript
export interface ParcoGestito {
  id: string;
  nome: string;              // es. "Giardino 25 Novembre"
  indirizzo: string;         // es. "Via Fosso dell'Osa / Via Prenestina"
  carenzaAttiva: boolean;    // se true, l'appello compare nella tab Volontari
  needMattino: number;       // quanti volontari servono per il Mattino
  needSera: number;          // quanti volontari servono per la Sera
  haveMattino: number;       // volontari attualmente assegnati al Mattino
  haveSera: number;          // volontari attualmente assegnati alla Sera
  note?: string;             // istruzioni specifiche (es. lucchetto, chiavi)
}

export type TurnoParcoScelto = 'mattino' | 'sera' | 'entrambi';
```

---

### Verification & Testing Plan
1. **Verifica Assenza Riferimento Cestini**: Verificare che in nessun testo, etichetta o messaggio compaia il riferimento ai cestini.
2. **Verifica Parchi Preconfigurati**: Confermare che all'avvio compaiano *"Giardino 25 Novembre"* e *"Parco di Via Riserva Nuova"*.
3. **Verifica Aggiunta Dinamica**: Inserire un nuovo parco di prova dall'area admin e verificare la corretta persistenza e comparsa in elenco.
4. **Verifica Attivazione Indipendente**: Attivare la carenza per un singolo parco e verificare che nella tab Volontariato compaia solo la richiesta di quel parco con i turni *"Mattino"* e *"Sera"*.
5. **Verifica Compilazione & Lint**: Eseguire `npm run lint` (`tsc --noEmit`) e `compile_applet` per assicurare zero regressioni.
