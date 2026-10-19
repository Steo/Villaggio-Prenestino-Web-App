=== VP Quartiere - Gestione Web App Villaggio Prenestino ===
Contributors: stefano.deprophetis
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.5.0
License: GPLv2 or later

Plugin WordPress ufficiale per la Web App dell'Associazione di Quartiere Villaggio Prenestino.

Novità v1.5.0:
- Supporto per 7 Categorie Merceologiche (Alimentari, Ristorazione, Farmacie & salute, Artigiani, Servizi alla persona, Servizi per animali, Casa & hobby).
- Geocodifica ad alta precisione al civico ed esatta corrispondenza dei pin sulla mappa senza dipendenza da fatturazione Google Cloud.
- Integrazione completa del modulo "🏪 Commercianti e Negozi di Quartiere": Custom Post Type `vp_commercio` con supporto per orari, WhatsApp ordini, promozioni residenti e coordinate Google Maps.
- Sistema di moderazione e approvazione amministratore: le nuove attività registrate dall'app vengono inserite con stato "In attesa di approvazione" (pending) esattamente come le segnalazioni cittadine.
- Tab dedicata "🏪 Commercianti" nella Dashboard Hub di WordPress con filtri (In Attesa / Pubblicati) e pulsante di approvazione rapida 1-click.
- Notifiche in bacheca con contatore visivo per le nuove attività in attesa di revisione.
- REST API v1 complete: `POST /wp-json/vp/v1/commercio` con moderazione, `POST /wp-json/vp/v1/commercio/vota` per il conteggio "Mi piace" e sincronizzazione nella chiamata unica `GET /wp-json/vp/v1/dati`.

Novità v1.3.2: 
- Cliccando su "🏡 VP Quartiere" nel menu verticale di WordPress si apre direttamente la "📊 Dashboard & Tab Hub" con tutte le statistiche e le schede per gestire contenuti ed eventi.
- Installazione pulita: database completamente azzerato alla prima attivazione (zero dati fittizi), pronto a registrare e caricare all'istante i dati reali inviati dai residenti tramite la Web App.

== Installazione ==
1. Da WordPress vai su Plugin > Aggiungi nuovo > Carica plugin.
2. Seleziona il file zip "vp-quartiere.zip" e clicca "Installa adesso" (sostituisci la versione precedente se richiesta).
3. Clicca "Attiva plugin".
4. Troverai la voce principale nel menu verticale di WordPress: "🏡 VP Quartiere".
5. In "VP Quartiere > Commercianti" puoi revisionare e approvare le attività inserite dai negozianti.
