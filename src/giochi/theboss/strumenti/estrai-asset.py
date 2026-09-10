"""
Da dove vengono i disegni di The Boss, e come si rifanno.

Gli asset dentro `assets/` non sono ritagliati a mano: escono da questo
script. Chi domani vuole un personaggio in piu' aggiunge una riga a `CAST`
e rilancia, invece di aprire un editor di immagini e sperare di ricordarsi
da dove aveva preso il ritaglio di prima.

Non fa parte della build e non lo esegue nessuno automaticamente: gira una
volta, a mano, quando cambiano gli asset. Per questo e' in Python e non in
JavaScript — ridurre un PNG in Node vorrebbe dire aggiungere una
dipendenza al progetto per un lavoro che si fa tre volte in un anno.

    python3 src/giochi/theboss/strumenti/estrai-asset.py /dove/stanno/i/pacchetti

I pacchetti NON stanno nel repository: le loro licenze vietano la
ridistribuzione. Chi rilancia lo script deve averli scaricati. Nella
cartella che si passa si aspetta:

    Modern_Interiors_RPG_Maker_Version/   LimeZu, versione completa (comprata)
    Basic_Asset_Pack_1/ _2/ _3/           deepdivegamestudio
    basic_asset_pack/                     deepdivegamestudio, demoni
    Tiny_RPG_Character_Asset_Pack_01*/    soldato e orco

LA SCALA. LimeZu vende la versione RPG Maker a 48 pixel per cella, ma
quell'arte e' un ingrandimento per tre esatto dell'originale a 16: ogni
blocco di tre per tre e' di un colore solo (verificato su tutti i fogli che
usiamo, quarantaquattromila blocchi, zero eccezioni). Quindi si divide per
tre col vicino piu' prossimo e si riottiene l'arte originale senza
inventare un pixel. Sedici e' la risoluzione degli altri due giochi di
Achivia, e mescolare le scale si vedrebbe.

I personaggi non si toccano: arrivano gia' a sedici, quattro fotogrammi di
attesa in un foglio da 64x16. Si copiano e si rinominano, e il nome nuovo
e' quello che il gioco usa — il codice non deve sapere che il troll di
pietra si chiamava `StoneTroll.png`.
"""

import os
import shutil
import sys
from PIL import Image

QUI = os.path.dirname(os.path.abspath(__file__))
MODULO = os.path.dirname(QUI)
USCITA = os.path.join(MODULO, 'assets')

# ─── I venti che lavorano qui ───
# id nel gioco → nome del file nel pacchetto. L'ordine e' quello del cast.
CAST = {
    # i dipendenti
    'brocca':      'StoneTroll',          # imbottigliamento
    'conto':       'DecrepitBones',       # contabilita'
    'assaggio':    'OchreJelly',          # controllo qualita'
    'ricerca':     'GoblinOccultist',     # ricerca e sviluppo
    'vendite':     'HalflingBard',        # vendite
    'magazzino':   'RoyalScarab',         # magazzino
    'orto':        'FungalMyconid',       # coltivazione ingredienti
    'consegne':    'VampireBat',          # consegne notturne
    'forgia':      'CrimsonImp',          # forgia e incantesimi minori
    'erbe':        'HalflingRanger',      # approvvigionamento
    'guardia':     'LizardfolkScout',     # sicurezza
    'etichette':   'GhastlyEye',          # etichette e conformita'
    'manutenzione': 'BlindedGrimlock',    # manutenzione
    'collaudo':    'ToxicHound',          # collaudo
    'segreteria':  'SkitteringHand',      # segreteria
    'carico':      'BrawnyOgre',          # carico e scarico
    # gli assistant manager
    'am-strategia':  'DepravedBlackguard',
    'am-produzione': 'CrushingCyclops',
    'am-efficienza': 'HalflingAssassin',
    'am-innovazione': 'GrinningGremlin',
}

# ─── I fogli della scena, da LimeZu ───
# nome nel gioco → percorso dentro il pacchetto RPG Maker, e se il foglio e'
# un ingrandimento esatto per tre (quasi tutti lo sono) o va ridotto a
# maggioranza. `maggioranza` e' una modifica all'arte e come tale sta
# scritta in CREDITS.md: si usa solo dove serve.
SCENA = {
    'muri':       ('RPG_MAKER_MV/Walls_TILESET_A4_.png', 'maggioranza'),
    'pavimenti':  'RPG_MAKER_MV/Floors_TILESET_A2_.png',
    'scaffali':   'RPG_MAKER_MV/Interiors/Theme_Sorter_MV/Classroom_and_Library_01.png',
    'libreria':   ('RPG_MAKER_MV/Interiors/Theme_Sorter_MV/Classroom_and_Library_02.png', 'maggioranza'),
    'riunioni':   'RPG_MAKER_MV/Interiors/Theme_Sorter_MV/Conference_Hall_01.png',
    'generico':   ('RPG_MAKER_MV/Interiors/Theme_Sorter_MV/Generic_01.png', 'maggioranza'),
    'laboratorio': 'RPG_MAKER_MV/Interiors/Theme_Sorter_MV/Kitchen_02.png',
    'vetrine':    ('RPG_MAKER_MV/Interiors/Theme_Sorter_MV/Museum_01.png', 'maggioranza'),
}

# ─── Il capo: il cavaliere ───
CAPO = {
    'fermo':     'Characters(100x100 split)/Soldier/Soldier/Soldier_Idle.png',
    'cammina':   'Characters(100x100 split)/Soldier/Soldier/Soldier_Walk.png',
}
# Il riquadro utile dentro i 100x100 del pacchetto: il resto e' aria.
# Sono gli stessi numeri con cui e' ritagliato il soldato dell'arena.
CAPO_RITAGLIO = (30, 30, 70, 70)


def trova(radice, nome_file):
    """Il primo file con questo nome dentro l'albero. I pacchetti annidano molto."""
    for base, _, files in os.walk(radice, followlinks=True):
        if nome_file in files:
            return os.path.join(base, nome_file)
    return None


def blocchi_misti(im, n=3):
    """Quanti blocchi `n`x`n` non sono di un colore solo, e quanti sono in tutto.

    Zero vuol dire che l'immagine e' un ingrandimento per `n` esatto, e
    ridurla non inventa niente.
    """
    px = im.load()
    w, h = im.size
    if w % n or h % n:
        return None, None
    misti = 0
    totale = 0
    for by in range(0, h, n):
        for bx in range(0, w, n):
            c = px[bx, by]
            totale += 1
            if any(px[x, y] != c for y in range(by, by + n) for x in range(bx, bx + n)):
                misti += 1
    return misti, totale


def riduci(percorso, destinazione, modo='esatto', n=3):
    """Da 48 a 16. `modo` 'esatto' rifiuta i fogli che non sono ingrandimenti
    esatti; 'maggioranza' li accetta e prende il colore piu' frequente di ogni
    blocco — che e' una modifica all'arte, e va dichiarata."""
    im = Image.open(percorso).convert('RGBA')
    misti, totale = blocchi_misti(im, n)
    if misti is None:
        raise SystemExit(f'[the boss] {percorso} non e\' divisibile per {n}.')
    if misti and modo == 'esatto':
        raise SystemExit(
            f'[the boss] {percorso}: {misti} blocchi su {totale} non sono di un '
            f'colore solo, quindi non e\' un ingrandimento per {n} e ridurlo '
            'inventerebbe pixel. Se e\' voluto, dichiaralo \'maggioranza\' in SCENA '
            'e scrivilo fra le modifiche in CREDITS.md.')
    w, h = im.size
    if misti == 0:
        fuori = im.resize((w // n, h // n), Image.NEAREST)
    else:
        px = im.load()
        fuori = Image.new('RGBA', (w // n, h // n))
        out = fuori.load()
        for by in range(0, h, n):
            for bx in range(0, w, n):
                conta = {}
                for y in range(by, by + n):
                    for x in range(bx, bx + n):
                        c = px[x, y]
                        conta[c] = conta.get(c, 0) + 1
                out[bx // n, by // n] = max(conta.items(), key=lambda v: v[1])[0]
    fuori.save(destinazione)
    return im.size, fuori.size, misti, totale


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    radice = sys.argv[1]
    os.makedirs(os.path.join(USCITA, 'personaggi'), exist_ok=True)
    os.makedirs(os.path.join(USCITA, 'scena'), exist_ok=True)
    os.makedirs(os.path.join(USCITA, 'capo'), exist_ok=True)

    print('I personaggi (copiati com\'erano, 64x16, quattro fotogrammi):')
    for id_gioco, nome in CAST.items():
        src = trova(radice, nome + '.png')
        if not src:
            raise SystemExit(f'[the boss] manca {nome}.png sotto {radice}')
        dst = os.path.join(USCITA, 'personaggi', id_gioco + '.png')
        shutil.copyfile(src, dst)
        print(f'  {id_gioco:16} ← {nome}')

    print('\nLa scena (LimeZu a 48, ridotta a 16):')
    limezu = os.path.join(radice, 'Modern_Interiors_RPG_Maker_Version')
    for id_gioco, voce in SCENA.items():
        rel, modo = voce if isinstance(voce, tuple) else (voce, 'esatto')
        src = os.path.join(limezu, rel)
        if not os.path.exists(src):
            raise SystemExit(f'[the boss] manca {src}')
        dst = os.path.join(USCITA, 'scena', id_gioco + '.png')
        prima, dopo, misti, totale = riduci(src, dst, modo)
        nota = '' if misti == 0 else f'  (a maggioranza: {misti}/{totale} blocchi misti)'
        print(f'  {id_gioco:16} {prima[0]}x{prima[1]} → {dopo[0]}x{dopo[1]}{nota}')

    print('\nIl capo (il cavaliere, ritagliato dai riquadri da 100):')
    for id_gioco, rel in CAPO.items():
        src = trova(radice, os.path.basename(rel))
        if not src:
            raise SystemExit(f'[the boss] manca {rel}')
        im = Image.open(src).convert('RGBA')
        n = im.width // 100
        x0, y0, x1, y1 = CAPO_RITAGLIO
        lato = x1 - x0
        out = Image.new('RGBA', (lato * n, y1 - y0))
        for f in range(n):
            out.alpha_composite(im.crop((f * 100 + x0, y0, f * 100 + x1, y1)), (f * lato, 0))
        out.save(os.path.join(USCITA, 'capo', id_gioco + '.png'))
        print(f'  {id_gioco:16} {n} fotogrammi da {lato}x{y1 - y0}')


if __name__ == '__main__':
    main()
