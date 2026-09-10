# The Boss — come è fatto, e come si cambia

Un gestionale a decisioni: sei a capo di un'officina di pozioni nel regno di
Achivia, trenta giorni, e tre risposte possibili a ogni richiesta.

## Dove sta cosa

```
src/giochi/theboss/
  motore/          la simulazione. JS puro: niente DOM, niente rete, niente orologio
    caso.js        il PRNG seminato: senza questo niente si può rigiocare
    persone.js     le venti persone, la loro memoria, gli umori
    leve.js        l'unico posto dove un "gradino" diventa un numero
    pescaggio.js   chi bussa oggi, con che archetipo e a che livello
    testi.js       quale testo esce, fra quelli della banca
    giornata.js    i conti della sera, le spirali, gli eventi
    partita.js     l'API pubblica: creaPartita, iniziaGiornata, decidi, chiudiGiornata
  contenuti/
    bilancio.js    TUTTI i numeri del gioco. Nessun altro file ne contiene
    archetipi.js   33 archetipi: che cosa fa una richiesta, in gradini
    eventi.js      22 eventi del mondo, alcuni capovolgono le regole
    cast.js        chi lavora qui: identità e tratti, zero numeri
    umori.js       l'unico file in cui vive un'emoji
    stanza.js      dove sta ogni mobile, in pixel
    richieste/     la banca dei testi, a lotti
  strumenti/       attrezzi da riga di comando, non fanno parte della build
  assets/          i disegni, ritagliati da estrai-asset.py
```

Fuori dal modulo: `src/components/theboss/` (le parti di schermo),
`src/pages/giochi/*TheBoss*.jsx` (le schermate), `src/data/theboss.js` e
`src/data/deposito/theboss.js` (salvataggio, punteggio, classifica),
`src/styles/theboss.css`.

## I comandi

| | |
|---|---|
| `npm run boss:prove` | le prove del motore: 92 controlli |
| `npm run boss:sim` | il simulatore: 10.000 partite per politica, e il win rate |
| `npm run boss:banca` | valida la banca dei testi: schema, doppioni, quote, copertura |
| `npm run boss:emoji` | fallisce se un'emoji è finita fuori da `umori.js` |
| `npm run boss:consigli` | mette alla prova i 33 consigli di fine partita su 2.000 partite |

## Come si cambia il bilanciamento

**Un numero solo si tocca in `contenuti/bilancio.js`.** Poi si rilancia
`npm run boss:sim` e si guarda la tabella. I bersagli sono:

- politica `equilibrata` fra il 10% e il 14% di vittorie (sta al 12,4%);
- `accetta-sempre` e `rifiuta-sempre` sotto il 2%.

Le leve che spostano di più, in ordine:

1. `ECONOMIA.ricavoPerTesta` — la leva più diretta: **~3 punti di win rate
   ogni 4 monete** su una partita da trenta giorni. È quella con cui si
   riporta il gioco dentro il bersaglio dopo ogni altro cambiamento.
2. `INDULGENZA.perSi` e `RANCORE.perNo` — quanto in fretta si accendono le
   due spirali. Alzarli rende il gioco più corto e più cattivo.
3. `INDULGENZA.rincaro` — quanto costa di più una richiesta a ogni livello
   di escalation.
4. `ECONOMIA.rincaro` — l'inflazione del regno, in due tempi: fa scadere
   l'equilibrio trovato, così l'ultima settimana non diventa una formalità.
5. `PARTITA.giorni` — **cambiarla cambia tutto il resto**. Accorciare la
   partita alza il win rate di parecchio (da cinquanta a trenta giorni è
   passato dal 6% al 34%) e va sempre seguita da una nuova taratura di
   `ricavoPerTesta`, dalla curva di `RICHIESTE_PER_GIORNO` — che deve
   arrivare a diciotto nell'ultimo giorno, qualunque sia — e da
   `MANAGER.daGiorno`, che è metà partita.

## Come si aggiunge una richiesta alla banca

1. Si sceglie un archetipo esistente in `contenuti/archetipi.js`. Il testo
   **non può** dichiarare effetti: la meccanica è dell'archetipo.
2. Si scrive la voce in un file di `contenuti/richieste/`, con `r(...)`.
   L'id dev'essere nuovo e stabile: finisce nelle partite salvate.
3. Si lancia `npm run boss:banca`. Controlla schema, lunghezze, doppioni
   semantici (per trigrammi, non per parole uguali), quote di tono e
   copertura archetipo × tono.
4. Se il lotto è nuovo, lo si aggiunge all'elenco in `richieste/indice.js`.
5. **Si alza `VERSIONE_BANCA`** in `richieste/schema.js`: la versione si
   salva con ogni partita e serve a rigiocarla identica.

Il criterio di qualità è uno: ogni richiesta deve avere un motivo serio per
dire di sì e uno per dire di no. Se la risposta è ovvia, la voce non serve.

## Come si aggiunge un archetipo

In `contenuti/archetipi.js`, con gli effetti scritti in **gradini** e mai in
numeri (`{ cassa: -2, morale: +1 }`). Quanto vale un gradino sta in
`bilancio.js`, campo `PASSO`. Una prova fallisce se un archetipo porta un
valore più grande di sei: vuol dire che qualcuno sta scrivendo importi.

`differita` è la conseguenza che torna fra tre e dieci giorni, con la
`causa` scritta: il rapporto della sera la nomina, ed è il pezzo che insegna
la lezione del gioco.

## Come si aggiunge un evento

In `contenuti/eventi.js`. Un evento può cambiare i numeri (`ricavo`,
`costi`, `ogniGiorno`) oppure **le regole**: `capovolge` elenca gli
archetipi il cui segno si rovescia mentre dura — è come la peste rende il
lavoro da casa una cosa buona invece che cattiva.

## Il determinismo, e perché è la cosa più importante

Dato `(seme, sequenza di risposte)` la partita è sempre la stessa. Serve a
tre cose: rigiocare un difetto, far girare il simulatore, e permettere un
giorno a un server di **ricontrollare un punteggio rigiocando la partita**
invece di fidarsi. Quel controllo è già scritto e già gira:
`verificaPartita` in `data/deposito/theboss.js`.

Regole che lo tengono in piedi, e che una prova verifica:

- nessun `Math.random` nel modulo: c'è `caso.js`, che nasce dal seme;
- nessun orologio nel motore: il tempo è un problema della schermata, che
  quando scade dice `decidi(stato, 'scaduta')`;
- gli import portano l'estensione `.js`, così `node` esegue il motore così
  com'è e gli attrezzi sono comandi e non procedure.

## Che cosa manca, ed è scritto apposta

- **La validazione lato server**: non c'è un server. Il punteggio lo scrive
  il client. Il controllo che c'è ferma una manomissione ingenua e non
  ferma chi apre la console. È lo stesso livello degli altri due giochi,
  dichiarato invece che sottinteso.
- **Il filtro geografico** della classifica: il profilo di Achivia non ha un
  campo paese, e l'unico dato di posizione che esiste è il consenso del
  mercato del lavoro, dato per un'altra finalità.
- **La banca a 1800 voci**: adesso sono 352, tutte scritte a mano, con tutti
  e 33 gli archetipi coperti e nessuno sotto le cinque voci. Una partita ne
  consuma circa 300, quindi **dentro una partita non se ne ripete una**.
  L'infrastruttura regge qualche migliaio di voci senza cambiare una riga.
