# Medaglie delle competenze personalizzate

Quarantotto disegni, ognuno nei quattro metalli: bronze (livello 1), silver
(2), gold (3), diamond (4). In tutto 192 file, `custom-01-1.png` ...
`custom-48-4.png`, ritagliati dagli otto fogli di "badges competenze
personalizzate.zip" (24 medaglie per foglio, due fogli per metallo).

Le sceglie il manager quando crea una competenza: il modulo mostra la
griglia dei disegni e salva in `badgeImage` solo il nome della famiglia
(`custom-07`). Il livello lo aggiunge `src/data/skillBadges.js`, che qui
cerca `custom-07-3.png` quando la certificazione e' Advanced.

Una famiglia entra nell'elenco solo se ha tutti e quattro i livelli: per
aggiungerne una servono quindi quattro file con lo stesso prefisso.
