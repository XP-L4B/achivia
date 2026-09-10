import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import ModuloFinestra from './ModuloFinestra';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import {
  getPubblicita, salvaReclame, eliminaReclame, reclameValida, visteDi,
  POSIZIONI, getPiani, LIVELLI_PUBBLICITA,
  secondiSpot, salvaSecondiSpot, SECONDI_SPOT_MASSIMO,
} from '../../data/db';

const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');
const perInput = (iso) => (iso ? String(iso).slice(0, 10) : '');
const nomeDi = (elenco, id) => elenco.find((x) => x.id === id)?.nome || id;

const VUOTA = {
  nome: '', titolo: '', testo: '', collegamento: '',
  posizione: 'banner', peso: 1, da: null, a: null, attiva: true,
};

/**
 * LA PUBBLICITA' — che cosa vede chi non paga.
 *
 * Due spazi: il banner, che sta fermo in fondo alle schermate, e lo spot,
 * che parte quando si assegna una quest. Chi li vede lo decide il piano, e
 * si cambia dal listino; che cosa ci va dentro si decide qui.
 *
 * Quando uno spazio e' vuoto non sparisce: mostra che e' uno spazio. E'
 * voluto — chi sta sul piano con la pubblicita' deve vederla anche il
 * giorno in cui non e' stata venduta a nessuno, se no il piano di sopra
 * sembra togliere qualcosa che non c'era.
 */
export default function PubblicitaPage() {
  const [apri, setApri] = useState(null);
  const [errore, setErrore] = useState('');
  const [, bump] = useState(0);
  const ridisegna = () => bump((v) => v + 1);

  const tutte = getPubblicita();
  const vive = tutte.filter((r) => reclameValida(r));
  const campo = (chiave, valore) => setApri((s) => ({ ...s, [chiave]: valore }));

  function salva() {
    if (!salvaReclame(apri)) { setErrore('Non è stato possibile salvare: lo spazio è finito.'); return; }
    setErrore('');
    setApri(null);
    ridisegna();
  }

  const riquadro = (titolo, righe, vuoto) => (
    <TerminalPanel titolo={titolo} meta={`${cifra(righe.length)}`}>
      {righe.length === 0 ? <p className="tv-vuoto">{vuoto}</p> : righe.map((r) => (
        <section key={r.id} className="cas-scheda">
          <header className="cas-scheda-testa">
            <b>{r.nome || r.titolo || 'Senza nome'}</b>
            <small>{nomeDi(POSIZIONI, r.posizione)}</small>
          </header>
          <TerminalRows
            voci={[
              ['Titolo', r.titolo || '—'],
              r.testo ? ['Testo', r.testo] : null,
              r.collegamento ? ['Porta a', r.collegamento] : null,
              ['Dal', giorno(r.da)],
              ['Al', r.a ? giorno(r.a) : 'senza scadenza'],
              ['Quanto spesso', `peso ${cifra(r.peso)}`],
              { id: 'viste', label: 'Volte che è comparsa', valore: cifra(visteDi(r.id)) },
              ['Accesa', r.attiva ? 'sì' : 'no'],
            ].filter(Boolean)}
          />
          <div className="cas-azioni">
            <Button variante="secondario" compatto onClick={() => setApri({ ...r })}>Modifica</Button>
            <Button
              variante="fantasma"
              compatto
              onClick={() => { salvaReclame({ id: r.id, attiva: !r.attiva }); ridisegna(); }}
            >
              {r.attiva ? 'Spegni' : 'Accendi'}
            </Button>
            <Button
              variante="fantasma"
              compatto
              onClick={() => { eliminaReclame(r.id); ridisegna(); }}
            >
              Elimina
            </Button>
          </div>
        </section>
      ))}
    </TerminalPanel>
  );

  return (
    <>
      <PageShell
        title="Pubblicità"
        description="Che cosa compare negli spazi. Chi li vede lo decide il piano, dal listino."
      />

      <div className="ui-blocco con-stacco">
        {/* Chi la vede si legge dai piani e non si cambia da qui: e' una
            riga del listino. Averla sotto gli occhi mentre si scrive una
            reclame evita di scriverne una per un pubblico che non esiste. */}
        <TerminalPanel titolo="CHI LA VEDE" meta="DAL LISTINO">
          <TerminalRows
            voci={getPiani().map((p) => ({
              id: p.id,
              label: p.nome,
              valore: nomeDi(LIVELLI_PUBBLICITA, p.limiti.pubblicita),
              tono: p.limiti.pubblicita === 'no' ? 'spento' : undefined,
            }))}
          />
        </TerminalPanel>

        {/* La durata dello spot e' l'unico numero di questa pagina che non
            riguarda una singola reclame: riguarda quanto pesa il piano
            gratuito addosso a chi ce l'ha. Sta qui perche' e' il posto in
            cui si guarda la pubblicita', e si prova cambiandolo. */}
        <TerminalPanel titolo="QUANTO DURA LO SPOT" meta={`${cifra(secondiSpot())} SECONDI`}>
          <form
            className="tv-modulo"
            onSubmit={(e) => {
              e.preventDefault();
              salvaSecondiSpot(new FormData(e.target).get('spot-sec'));
              ridisegna();
            }}
          >
            <label className="label" htmlFor="spot-sec">
              Secondi prima che si possa chiudere (0 = si chiude subito)
              <input
                id="spot-sec"
                name="spot-sec"
                type="number"
                min="0"
                max={SECONDI_SPOT_MASSIMO}
                defaultValue={secondiSpot()}
              />
            </label>
            <Button type="submit" variante="secondario" blocco>Salva</Button>
          </form>
          <p className="tv-nota">
            È il numero che decide se il piano gratuito è fastidioso o inaccettabile. Zero non è
            uno spot, trenta è un ostaggio.
          </p>
        </TerminalPanel>

        {riquadro('IN CORSO', vive, 'Nessuna reclame in corso: gli spazi mostrano che sono spazi.')}
        {riquadro('FERME', tutte.filter((r) => !reclameValida(r)), 'Nessuna reclame spenta o scaduta.')}

        <div className="cas-azioni">
          <Button variante="primario" blocco onClick={() => setApri({ ...VUOTA })}>
            Crea una reclame
          </Button>
        </div>

        {errore && <p className="ui-errore" role="alert">{errore}</p>}
      </div>

      <BackTile />

      {apri && (
        <ModuloFinestra
          titolo={apri.id ? 'Modifica la reclame' : 'Nuova reclame'}
          nota="Con più reclami nello stesso spazio si sceglie a caso: il peso dice quanto spesso."
          onSalva={salva}
          onChiudi={() => setApri(null)}
        >
          <label className="label" htmlFor="pub-nome">Nome (solo per te)
            <input id="pub-nome" value={apri.nome} onChange={(e) => campo('nome', e.target.value)} />
          </label>
          <label className="label" htmlFor="pub-titolo">Titolo
            <input id="pub-titolo" value={apri.titolo} onChange={(e) => campo('titolo', e.target.value)} required />
          </label>
          <label className="label" htmlFor="pub-testo">Testo
            <textarea id="pub-testo" rows={3} value={apri.testo} onChange={(e) => campo('testo', e.target.value)} />
          </label>
          <label className="label" htmlFor="pub-link">Porta a (indirizzo)
            <input id="pub-link" value={apri.collegamento} onChange={(e) => campo('collegamento', e.target.value)} />
          </label>
          <label className="label" htmlFor="pub-pos">Dove
            <select id="pub-pos" value={apri.posizione} onChange={(e) => campo('posizione', e.target.value)}>
              {POSIZIONI.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label className="label" htmlFor="pub-peso">Quanto spesso (peso)
            <input
              id="pub-peso"
              type="number"
              min="1"
              value={apri.peso}
              onChange={(e) => campo('peso', Number(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="pub-da">Dal
            <input id="pub-da" type="date" value={perInput(apri.da)} onChange={(e) => campo('da', e.target.value || null)} />
          </label>
          <label className="label" htmlFor="pub-a">Al (vuoto = senza scadenza)
            <input id="pub-a" type="date" value={perInput(apri.a)} onChange={(e) => campo('a', e.target.value || null)} />
          </label>
        </ModuloFinestra>
      )}
    </>
  );
}
