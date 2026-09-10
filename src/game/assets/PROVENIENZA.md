# Provenienza e licenze degli asset dell'arena

Ogni file in questa cartella viene da uno dei pacchetti qui sotto, ritagliato o
rinominato ma non ridisegnato. La regola: **nessun asset entra senza una riga qui**,
con la licenza come sta scritta nel pacchetto o come l'ha trascritta chi lo ha
scaricato, e la data.

Gli asset si usano *dentro il gioco*, mai ridistribuiti come pacchetto: al momento
della build vanno impacchettati in un atlante, non serviti come cartella navigabile.

| Cartella / file | Pacchetto d'origine | Autore | Licenza | Obblighi |
|---|---|---|---|---|
| `characters/soldato-*.png`, `characters/orco-*.png`, `weapons/freccia.png` | Tiny RPG Character Asset Pack 01 v2.0 (Free Soldier & Orc) | itch.io, autore da confermare | Nessun file nel pacchetto. Termini trascritti dal proprietario il 2026-09-02: uso commerciale e non commerciale consentito in videogiochi e progetti personali; modifica consentita; vietato rivendere, riconfezionare o ridistribuire, in forma originale o modificata; vietato includere in strumenti di creazione di giochi, template di codice, progetti NFT/crypto | Non ridistribuire; **non usare in un progetto NFT/crypto** |
| `characters/furfante-idle.png`, `arciere-idle.png`, `occultista-idle.png`, `gladiatore-idle.png` | Basic Asset Pack 2 — Basic Humanoid Animations | deepdivegamestudio (itch.io) — https://deepdivegamestudio.itch.io/humanoid-asset-pack | Come sopra (stessi termini, trascritti dalla pagina del pacchetto) | Come sopra |
| `enemies/ossa.png`, `enemies/mano.png`, `enemies/segugio.png`, `enemies/arciere.png`, `enemies/scarabeo.png` | Basic Asset Pack 3 — Basic Undead Animations | deepdivegamestudio (itch.io) | Come sopra | Come sopra |
| `enemies/troll.png`, `enemies/melma.png`, `enemies/melmetta.png`, `enemies/ciclope.png`, `enemies/ettin.png`, `enemies/occhio.png` | Basic Asset Pack 1 — Basic Monster Animations | deepdivegamestudio (itch.io) | Come sopra | Come sopra |
| `enemies/balor.png` | Basic Asset Pack — Basic Demon Animations | deepdivegamestudio (itch.io) | Come sopra | Come sopra |
| `enemies/cavalcalupo.png` | Basic Asset Pack 2 — Basic Humanoid Animations | deepdivegamestudio (itch.io) | Come sopra | Come sopra |
| `world/pavimento.png`, `world/torcia.png` | RF Catacombs v1.0 | Szadi art | `public-license.txt` nel pacchetto: *«Public domain and free to use, personal or commercial. Credit is not required but appreciated. You can edit, but not resell the asset pack (original or changed).»* | Nessuno (credito gradito) |
| `ui/modulo-*.png`, `ui/arma-*.png`, `ui/effetto-*.png` | VerArc Stash — Basic Skills and Buffs | da confermare | Nessun file nel pacchetto; il proprietario dichiara l'uso libero. **Da allegare il link della pagina di download** | Da confermare |

## Pacchetti ricevuti e non usati

| Pacchetto | Perché |
|---|---|
| PostApocalypse Asset Pack v1.1.2 (TheLazyStone) | Licenza: gratis solo per uso non commerciale, uso commerciale a pagamento, **nessuna ridistribuzione**. Tema incompatibile. Escluso dal proprietario. |
| Time Fantasy — Ashlands (finalbossblues) | Il readme dice «free release» ma non parla di uso commerciale: da verificare su timefantasy.net prima di qualsiasi uso. Stile e formato autotile diversi dal resto. |
| RPG Worlds Caves v2.1 | Licenza chiara (commerciale consentito, vietato in loghi/marchi e la rivendita). Tenuto per una seconda arena. |
| 2D Pixel Dungeon Asset Pack v2.0, Enemy Animations Set | Nessun file di licenza nel pacchetto. Tenuti per dopo, in attesa dei termini. |
| Basic Asset Pack (Demoni) | Stessi termini di deepdivegamestudio. Usato un solo foglio (il Balor); il resto tenuto per le ondate successive. |
| Weapons Asset 16x16 | Nessun file di licenza. Da attribuire. |
| Kyrise's 16x16 RPG Icon Pack v1.3 | **CC BY 4.0**: uso commerciale libero, **attribuzione obbligatoria** («Kyrise») in un posto visibile. Da usare per le icone del cruscotto. |
| Animated Chests | Nessun file di licenza. Le casse dell'arena si disegnano in codice (`disegno.js`, `cassePronte`). |
| RPG Items (Jesse / GentleCatStudio, 2018) — **CC0 1.0** | Ci stava la gemma dell'esperienza, una taglia sola. Adesso le gemme sono cinque, una per fascia di esperienza, e si disegnano in codice (`disegno.js`, `gemmePronte`): una regola sola invece di cinque file. Il pacchetto resta CC0, se servisse un oggetto. |

## Una nota che riguarda tutta l'app

I termini di deepdivegamestudio vietano l'uso in *«NFT/crypto projects»*. Achivia
oggi ha nel Marketplace una sezione dimostrativa che collega un wallet e mostra NFT
da OpenSea su rete di prova. Non è un progetto NFT — ma se le medaglie diventassero
token, questi asset non potrebbero più stare nella stessa applicazione.
