# Medaglie degli achievement

Le immagini vanno qui, come file PNG. Nessun codice da toccare:
`src/data/achievementBadges.js` le raccoglie dal nome del file.

| Nome del file | Quando viene usato |
|---|---|
| `closer-unlocked.png` | la medaglia di Closer, da ottenuta |
| `closer-locked.png` | la stessa, ancora da conquistare |
| `closer.png` | una sola immagine per i due stati |
| `default-unlocked.png` | qualunque achievement ottenuto senza medaglia propria |
| `default-locked.png` | qualunque achievement ancora da prendere |
| `default.png` | l'ultima spiaggia |

Gli id degli achievement stanno in `src/data/achievementsCatalog.js`:
`deadline-master`, `closer`, `team-player`, `helping-hand`, `skill-king`,
`outstanding`, `skill-builder`, `extra-mile`.

Tutti e otto ce l'hanno, ritagliate da `Achievement.png`: un file per
achievement, valido per i due stati — da conquistare il componente la mostra
spenta. Per sostituirne una basta sovrascrivere il file con lo stesso nome; se
servisse un disegno diverso fra i due stati, bastano i file `-locked` e
`-unlocked`.

Finche' un file non c'e', il badge e' un segnaposto tecnico — un tondo con le
iniziali dell'achievement — e si vede che e' un segnaposto.
