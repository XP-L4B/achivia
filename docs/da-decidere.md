# Quello che resta da decidere

Le cose rimandate, con il perché sono ferme e che cosa serve per farle
ripartire. Sta qui e non in una conversazione perché una decisione ricordata
a memoria è una decisione che si riprende sbagliata fra tre settimane.

Chi legge questo file per rispondere alla domanda «che altro c'è da fare»:
sono queste, in ordine di quanto costa lasciarle ferme.

---

## 1. La cassa non paga ancora le quest

**Com'è adesso.** Una quest approvata *crea* crediti dal nulla: non escono da
nessuna parte. La cassa dell'organizzazione esiste, il piano ci mette dentro
la dotazione, e da lì si versa a mano alle persone — ma il gioco vero, le
quest, non la tocca.

**Perché è un problema.** Un'azienda Standard, che ha zero crediti mensili,
paga le quest esattamente come una Diamond che ne ha seimila. Finché è così,
la dotazione del piano non compra niente che non si abbia già gratis, e il
numero più grosso del listino è quello che vale di meno.

**Che cosa serve per decidere.** Una risposta sola: sul piano Standard, con
la cassa a zero, le quest continuano a pagare dal nulla oppure smettono di
pagare? Se smettono, lo Standard ha bisogno di una dotazione sua. Se
continuano, la cassa resta una cosa a parte e va detto chiaramente a che
serve.

## 2. Il servizio di pagamento

**Com'è adesso.** I pagamenti si registrano a mano dal Castello
(`/castle/pagamenti`). Registrarne uno apre o rinnova l'abbonamento, mette
l'organizzazione sul piano pagato e fa uscire la dotazione in cassa.

**Che cosa manca.** Il servizio esterno — chi incassa davvero. Quando c'è,
chiamerà `registraPagamento` al posto della mano, e quella pagina diventa il
registro di quello che ha fatto. Le pagine che mostrano i prezzi senza
venderli (`/compra-crediti`, `/admin/settings/piani`) cambiano di un
pulsante.

In `/compra-crediti` il percorso è già intero fino a li': si sceglie il
pacchetto, si sceglie obbligatoriamente dove vanno i crediti — conto
personale o cassa di un'organizzazione che si possiede — e si arriva al
riepilogo. Manca solo chi incassa: al posto del riquadro "non ancora" andra'
il pulsante, e la destinazione scelta e' gia' quella che dira' se chiamare
`muoviCrediti` o `muoviCassa`.

**Che cosa serve per decidere.** Quale servizio, e se i crediti si comprano
con lo stesso o con un altro.

## 3. L'AML

**Com'è adesso.** Il CRM del Castello ha due livelli: quello operativo,
sempre visibile (numero Achivia, email, iscrizione, movimenti), e l'identità
anagrafica a richiesta, con un motivo obbligatorio e un registro delle
occhiate che non si cancella.

**Che cosa manca.** Il terzo livello — il fascicolo antiriciclaggio — non è
stato costruito, e non va costruito prima di sapere se serve. La domanda è
se la vendita di crediti per denaro renda Achivia un soggetto obbligato.

**Che cosa serve per decidere.** La verifica legale. Se la risposta è sì, il
fascicolo va in un archivio separato dal profilo: è l'unico modo di tenere
insieme l'obbligo di conservare e il diritto alla cancellazione.

---

## Cose minori, già decise ma non fatte

- **Il tetto delle domande all'assistente è uno solo.** Oggi tutte le azioni
  scalano lo stesso contatore dell'organizzazione. Va bene finché le azioni
  sono due; il giorno in cui diventano dieci, alcune costeranno più di altre
  e servirà un peso.
- **I piani sono tutti mensili.** Il modello regge anche l'annuale
  (`periodicita`), ma nessun piano lo usa. Un annuale scontato è la leva più
  semplice per allungare la vita di un cliente, e costa una riga di listino.
