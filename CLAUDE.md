# Regole di lavoro su Achivia

## Non testare l'interfaccia grafica

Le interfacce le prova Riccardo. Non avviare l'app per guardarla, non aprire
un browser, non fare screenshot: niente Playwright, niente `npm run dev` per
ispezionare una schermata.

Restano da fare, come sempre, le verifiche che non passano dall'aspetto:
`npm run build` e `npm run lint` devono essere puliti prima di consegnare.

Quando una modifica grafica è pronta, dichiara cosa hai cambiato e lascia la
prova visiva a lui.

## L'account negozio sta fuori dalle istruzioni generiche

L'account `shop` non è un profilo come gli altri: è una dashboard per
gestire catalogo e ordini. Vive fuori dalle organizzazioni, non ha ruolo né
permessi, e la sua area (`areaDi` → `shop`) non è quella di nessun altro.

Quando un'istruzione è generica — «in tutti i profili», «per tutti gli
account», «ovunque» — il negozio è escluso, a meno che non sia nominato
esplicitamente. Niente profilo, niente avatar, niente traguardi, niente
nickname, niente lega: quello che si aggiunge ai profili non lo riguarda.

## L'esperienza si guadagna, non si compra

Il livello di un account dice quanto una persona ha fatto. Quindi
l'esperienza segue solo i crediti guadagnati lavorando: una quest
approvata, una medaglia. Mai i crediti comprati con del denaro, mai la
dotazione di un abbonamento, mai un versamento dalla cassa, mai un
rimborso.

Se si comprasse, il livello direbbe quanto si ha speso, e sarebbe la
stessa parola per due cose diverse: chi legge una classifica non saprebbe
piu' che cosa sta leggendo.

La regola sta scritta in un posto solo — `deposito/crediti.js`, campo
`esperienza` sulla causale — e `accredita` la legge dalla riga appena
scritta nel registro. Chi aggiunge una causale nuova risponde alla domanda
nello stesso momento in cui la scrive; chi collega il servizio di
pagamento non deve ricordarsi di niente.

## Le finestre e i pulsanti portano gli angoli del terminale

Ogni finestra e ogni pulsante che si aggiunge da qui in avanti nasce con le
tacche a squadra agli angoli. Non è una decorazione facoltativa: è il segno
che tiene insieme schermate scritte in momenti diversi, e una superficie
nuova senza tacche si riconosce subito come venuta da fuori.

Il disegno sta in un posto solo — `src/styles/terminal.css`, capitolo
«Gli angoli». Non riscriverlo e non copiarlo altrove: si aggiunge il nome
della classe nuova ai due elenchi di quel capitolo (quello che dà
`position: relative` e quello che disegna le tacche con `::before`).

Due taglie, e si scelgono per dimensione, non per gusto:

- **9px di braccio, 3px di rientro** — le superfici larghe: pannelli,
  moduli, schede grandi, riquadri (`ui-tile`).
- **6px di braccio, 2px di rientro** — i comandi e le schede compatte:
  pulsanti, chip, voti, icone-bottone, righe che si premono, messaggi.
  Si ottiene aggiungendo la classe anche al terzo elenco, quello che
  ridichiara `--tv-tacca` e `--tv-tacca-dentro`.

Le tacche vogliono un angolo da marcare, quindi una finestra o un pulsante
nuovo nasce con gli angoli vivi: `var(--tv-radius)` per le superfici,
`var(--btn-raggio)` per i comandi. Non inventare una famiglia nuova con il
raggio grande.

Restano fuori, e restano fuori anche in futuro: il vetro col raggio grande
(la pillola del titolo, il pannello della descrizione in cima alle pagine,
le finestre di dialogo), le pillole e i cerchi, le etichette che non si
premono — `tv-chip`, `ui-stat`, il timer: sono valori, non superfici — e i
campi di testo, dove quattro squadre intorno a un cursore sono decoro.
