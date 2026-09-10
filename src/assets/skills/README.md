# Medaglie delle competenze

Le immagini delle medaglie vanno qui, come file PNG. Nessun codice da
toccare: `src/data/skillBadges.js` le raccoglie dal nome del file.

| Nome del file | Quando viene usato |
|---|---|
| `communication.png` | la medaglia della competenza `communication` |
| `communication-3.png` | la stessa competenza, ma al livello 3 (Advanced) |
| `communication-revoked.png` | quando una certificazione e' stata revocata |
| `default-3.png` | qualunque competenza al livello 3, se non ha la sua |
| `default.png` | qualunque competenza senza medaglia propria |
| `default-revoked.png` | qualunque certificazione revocata |

Tutte e sedici le soft skill standard hanno la loro medaglia, quattro per
competenza: bronze (livello 1), silver (2), gold (3), diamond (4) — 64 file
in tutto. Sono state ritagliate dai quattro fogli di "badges competenza soft
3.zip". Per sostituirne una basta sovrascrivere il file con lo stesso nome.

Gli id delle competenze standard stanno in `src/data/skillsCatalog.js`
(`communication`, `teamwork`, `leadership`, ...).

## Le competenze del mestiere

Le altre cento competenze standard — quelle nate per gli annunci di lavoro e
poi entrate nel catalogo (`saldatura`, `contabilita`, `inglese`, `cucina`,
...) — non hanno un disegno proprio: prendono una delle centoventi famiglie
di `custom/`, scritta nel campo `badgeImage`. La scelta e' fatta guardando
il disegno, e dove due competenze sono la stessa cosa fatta due volte la
medaglia e' la stessa: le otto lingue portano tutte le bandiere di
`mestiere-32`.

Il giorno in cui arrivano le loro medaglie proprie basta aggiungere i file
col nome dell'id (`saldatura-1.webp` ... `saldatura-4.webp`) e togliere il
`badgeImage`: `skillBadges.js` guarda prima l'id.

## Le settantadue famiglie del mestiere

`mestiere-01` ... `mestiere-72` sono arrivate come tre fogli in bronzo.
Argento, oro e diamante sono stati ricavati misurando i quattro metalli
sulle quarantotto famiglie `custom-*`, che li avevano gia': tinta,
saturazione e distribuzione della luce della corona esterna, dove c'e' solo
placca e mai pittogramma. La banda di tinte calde del bronzo viene portata
sul metallo di arrivo tenendo un terzo dello scarto originale (senza, la
placca perde il rilievo) e la luce si trasporta per percentili invece che
con una retta. I colori veri del pittogramma e i nastri non si toccano.

Sono in WebP e non in PNG: duecentottantotto file, quattro megabyte invece
di diciassette, con uno scarto medio di 1,6 su 255. Il glob di
`skillBadges.js` legge tutti e due i formati, e il nome del file resta la
sola cosa che conta.

## Competenze personalizzate

Le competenze create dai manager hanno un id generato, che nessun nome di
file puo' indovinare: le loro medaglie stanno in `custom/` e si scelgono dal
modulo di creazione. Sono 48 disegni, ognuno nei quattro metalli
(`custom-07-1.png` ... `custom-07-4.png`): la competenza salva solo il nome
della famiglia (`custom-07`) e il livello lo aggiunge `skillBadges.js`.

Ogni competenza ha quattro livelli (1 Beginner, 2 Intermediate, 3 Advanced,
4 Expert): se servono medaglie diverse per grado, bastano i file numerati.

Finche' un file non c'e', il badge viene disegnato come segnaposto: un
esagono con l'iniziale della competenza, nel colore della sua categoria.
