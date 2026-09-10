# The Boss — crediti e licenze

Il gioco non contiene un disegno fatto in casa. Tutto quello che si vede
viene dai pacchetti qui sotto, ritagliato e ridimensionato ma non
ridisegnato. **Nessun asset entra senza una riga in questa tabella**, ed è
la stessa regola che vale per l'arena (`src/game/assets/PROVENIENZA.md`).

I pacchetti originali **non stanno nel repository**: le loro licenze vietano
la ridistribuzione. Nel repository ci sono solo i ritagli che il gioco usa.
Chi deve rifarli parte da `strumenti/estrai-asset.py`, che dice anche che
cosa serve avere scaricato.

## La scena: l'ufficio

| | |
|---|---|
| **Pacchetto** | Modern Interiors — versione completa, RPG Maker |
| **Autore** | LimeZu — https://limezu.itch.io/moderninteriors |
| **Licenza** | *Modern Interiors Full Version License* |
| **Cosa consente** | uso e modifica in progetti commerciali e non commerciali |
| **Cosa vieta** | rivendere o ridistribuire l'asset, anche modificato |
| **Obblighi** | **crediti obbligatori** |
| **File usati** | `assets/scena/*.png` |

**Non è CC BY 4.0.** È una licenza propria del pacchetto, e va citata come
sta scritta nel suo `LICENSE.txt`. L'attribuzione è obbligatoria e vive
dentro il gioco, nella schermata «Crediti e licenze», non solo qui.

**Modifiche fatte.** LimeZu vende questa versione a 48 pixel per cella; il
gioco disegna a 16, come gli altri due giochi di Achivia. Quindi ogni foglio
è stato **ridotto a un terzo**. Per la maggior parte dei fogli la riduzione
non tocca l'arte: sono ingrandimenti per tre esatti, ogni blocco di 3×3
pixel è di un colore solo, e dividere restituisce l'originale. Quattro fogli
non lo erano, e lì ogni blocco è diventato **il suo colore più frequente**:

| Foglio | Blocchi non uniformi |
|---|---|
| `muri` | 2112 su 61440 (3,4%) |
| `vetrine` | 50 su 65536 (0,08%) |
| `generico` | 32 su 65536 (0,05%) |
| `libreria` | 25 su 65536 (0,04%) |

Nessun altro intervento: niente ricolorazioni, niente ridisegni, niente
composizioni salvate come file nuovi.

## I personaggi: chi lavora alla Alambicco & Soci

| | |
|---|---|
| **Pacchetti** | Basic Asset Pack 1 (mostri), 2 (umanoidi), 3 (non-morti) e Basic Demon Animations |
| **Autore** | deepdivegamestudio — https://deepdivegamestudio.itch.io/humanoid-asset-pack |
| **Licenza** | termini trascritti dalla pagina del pacchetto: uso commerciale e non commerciale consentito in videogiochi e progetti personali, modifica consentita |
| **Cosa vieta** | rivendere, riconfezionare o ridistribuire, in forma originale o modificata; includere in strumenti di creazione di giochi o template di codice; **usare in progetti NFT/crypto** |
| **File usati** | `assets/personaggi/*.png` |

**Modifiche fatte.** Nessuna sull'immagine: i fogli sono copiati com'erano,
64×16, quattro fotogrammi di attesa. È cambiato solo il nome del file, che
adesso dice il mestiere invece della specie (`StoneTroll.png` →
`brocca.png`): il codice non deve sapere che il responsabile
dell'imbottigliamento è un troll di pietra.

## Il capo: il cavaliere

| | |
|---|---|
| **Pacchetto** | Tiny RPG Character Asset Pack 01 v2.0 — Free Soldier & Orc |
| **Autore** | da confermare (itch.io) |
| **Licenza** | nessun file nel pacchetto; termini trascritti dal proprietario il 2026-09-02: uso commerciale e non commerciale consentito, modifica consentita; vietato rivendere, riconfezionare o ridistribuire; vietato includere in progetti NFT/crypto |
| **File usati** | `assets/capo/fermo.png`, `assets/capo/cammina.png` |

**Modifiche fatte.** I fogli originali hanno riquadri da 100×100 quasi tutti
vuoti: sono stati **ritagliati a 40×40** intorno alla figura, con gli stessi
numeri con cui è ritagliato il soldato dell'arena. Nessun ritocco all'arte.

È lo stesso disegno che in Achivia: Survival si chiama «soldato». Qui è il
capo, ed è voluto: chi ha già giocato all'arena riconosce la faccia.

## Una nota che riguarda tutta l'app

I termini di deepdivegamestudio vietano l'uso in progetti *NFT/crypto*.
Achivia oggi ha nel Marketplace una sezione dimostrativa che collega un
wallet e mostra NFT su rete di prova. Non è un progetto NFT — ma se le
medaglie diventassero token, questi disegni non potrebbero più stare nella
stessa applicazione. La stessa nota sta in `src/game/assets/PROVENIENZA.md`.

## Il resto dell'interfaccia

Pulsanti, pannelli, barre, angoli, tipografia e colori sono quelli di
Achivia: non è stato aggiunto nessun disegno e nessuna libreria grafica per
questo gioco.

Le **emoji** compaiono in un punto solo — sopra la testa di chi ha appena
ricevuto una risposta — e sono caratteri di sistema, non immagini. Che
stiano solo lì non è una promessa: lo verifica `npm run boss:emoji`.
