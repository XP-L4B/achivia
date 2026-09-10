import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { useAuth } from '../../context/AuthContext';
import { vetrinaPacchetti, euro, getUserById } from '../../data/db';
import { casseDiCui } from '../../data/cassa';

/**
 * Comprare crediti.
 *
 * Qui c'era un campo numerico e un pulsante viola, senza un solo gestore:
 * si scriveva una cifra, si premeva Acquista e non succedeva niente. Il
 * pagamento passa da un servizio esterno che non e' ancora stato scelto —
 * finche' non c'e', un modulo che sembra funzionante e' peggio del nulla:
 * chi lo compila crede di aver comprato dei crediti che non arriveranno
 * mai, e se ne accorge solo cercandoli.
 *
 * E' di tutti, non dell'admin. Stava dentro l'area amministratore perche'
 * li' c'era il pulsante che ce la portava, e voleva dire che un dipendente
 * con quarantasei crediti e un premio da cinquanta non aveva nessuna
 * strada.
 *
 * ─── Due passi, e il secondo non si salta ───────────────────────────────
 *
 * Prima il pacchetto, poi dove vanno i crediti. La seconda domanda e'
 * obbligatoria e non ha un valore preselezionato, ed e' voluto: un
 * interruttore gia' messo su una delle due risposte e' un interruttore che
 * nessuno legge, e qui la risposta sbagliata non si annulla. I crediti in
 * cassa sono dell'organizzazione — si distribuiscono e si spendono per lei —
 * e sul conto personale non tornano; quelli personali si spendono nel
 * negozio e nella cassa non entrano. Sono due destinazioni che non
 * comunicano, e chi paga deve saperlo prima e non dopo.
 *
 * La cassa compare solo a chi un'organizzazione la possiede. Comprare
 * crediti per una cassa e' mettere denaro proprio dentro una cosa di
 * qualcun altro: un co-admin che vuole rifornirla lo chiede a chi la
 * possiede, ed e' giusto che debba chiederlo.
 */
export default function CompraCreditiPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const pacchetti = vetrinaPacchetti();
  const casse = casseDiCui(me?.id);
  const [scelto, setScelto] = useState(null);
  const [dove, setDove] = useState('');

  const pacchetto = pacchetti.find((p) => p.id === scelto) || null;
  // "Dove" si azzera cambiando pacchetto: la domanda si rifa' ogni volta, e
  // una risposta rimasta da prima e' una risposta che nessuno ha riletto.
  const scegli = (id) => { setScelto(id === scelto ? null : id); setDove(''); };

  const destinazioni = [
    { id: 'personale', nome: 'Il tuo conto', nota: `Adesso hai ${cifra(me?.credits || 0)} crediti.` },
    ...casse.map((c) => ({
      id: `cassa:${c.orgId}`,
      nome: `La cassa di ${c.nome}`,
      nota: `In cassa ci sono ${cifra(c.saldo)} crediti.`,
    })),
  ];

  return (
    <>
      <PageShell
        title="Acquisto crediti"
        description="Scegli il pacchetto, poi dove devono andare i crediti."
      />
      <div className="ui-corpo-pagina">
        {pacchetti.length > 0 && (
          <TerminalPanel
            titolo="1 · IL PACCHETTO"
            meta={pacchetto ? pacchetto.nome || `${cifra(pacchetto.crediti)} crediti` : 'SCEGLINE UNO'}
            className="ui-blocco con-stacco"
          >
            {pacchetti.map((p) => (
              <section
                key={p.id}
                className={`cas-scheda${scelto === p.id ? ' is-scelta' : ''}`}
              >
                <header className="cas-scheda-testa">
                  <b>{p.nome || `${cifra(p.crediti)} crediti`}</b>
                  <small>{euro(p.finale)}</small>
                </header>
                <TerminalRows
                  voci={[
                    ['Crediti', cifra(p.crediti)],
                    p.bonus
                      ? { id: 'bonus', label: 'In più del taglio base', valore: cifra(p.bonus), tono: 'attesa' }
                      : null,
                    p.risparmio ? { id: 'sconto', label: 'Risparmi', valore: euro(p.risparmio), tono: 'attesa' } : null,
                    p.offerta ? ['Offerta in corso', p.offerta.nome] : null,
                  ].filter(Boolean)}
                />
                <div className="cas-azioni">
                  <Button
                    variante={scelto === p.id ? 'primario' : 'secondario'}
                    compatto
                    aria-pressed={scelto === p.id}
                    onClick={() => scegli(p.id)}
                  >
                    {scelto === p.id ? 'Scelto' : 'Scegli questo'}
                  </Button>
                </div>
              </section>
            ))}
          </TerminalPanel>
        )}

        {pacchetto && (
          <TerminalPanel
            titolo="2 · DOVE VANNO"
            meta={dove ? 'SCELTO' : 'DA SCEGLIERE'}
            className="ui-blocco con-stacco"
          >
            {/* La differenza va detta prima della domanda, non dopo: e' la
                sola informazione che serve per rispondere. */}
            <p className="tv-vuoto">
              {casse.length > 0
                ? 'I crediti sul tuo conto li spendi tu nel negozio. Quelli in cassa sono dell’organizzazione: li distribuisci alle persone e ci paghi quello che serve a lei. Da una parte all’altra non si spostano: scegli guardando a che cosa ti servono.'
                : 'I crediti vanno sul tuo conto e li spendi tu nel negozio. La cassa di un’organizzazione è un’altra destinazione, e compare qui solo se ne possiedi una.'}
            </p>
            <fieldset className="cred-dove">
              <legend className="label">Dove devono andare</legend>
              {destinazioni.map((d) => (
                <label key={d.id} className="cred-scelta" htmlFor={`dove-${d.id}`}>
                  <input
                    id={`dove-${d.id}`}
                    type="radio"
                    name="dove"
                    value={d.id}
                    checked={dove === d.id}
                    onChange={() => setDove(d.id)}
                  />
                  <span>
                    <b>{d.nome}</b>
                    <small>{d.nota}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          </TerminalPanel>
        )}

        {pacchetto && dove && (
          <TerminalPanel titolo="3 · RIEPILOGO" className="ui-blocco con-stacco">
            <TerminalRows
              voci={[
                ['Pacchetto', pacchetto.nome || `${cifra(pacchetto.crediti)} crediti`],
                ['Crediti', cifra(pacchetto.crediti)],
                ['Vanno a', destinazioni.find((d) => d.id === dove)?.nome || '—'],
                { id: 'prezzo', label: 'Da pagare', valore: euro(pacchetto.finale) },
              ]}
            />
          </TerminalPanel>
        )}

        <TerminalPanel titolo="NON ANCORA" className="ui-blocco con-stacco">
          <p className="tv-vuoto">
            Il pagamento passa da un servizio esterno che non è ancora collegato. Preferiamo
            dirtelo che darti un modulo che accetta una cifra e non consegna niente.
          </p>
          <p className="ui-dialog-hint">
            Nel frattempo i crediti entrano in circolo nel modo per cui sono nati: le quest
            portate a termine li pagano a chi le ha chiuse.
          </p>
          <Button variante="secondario" compatto to="/marketplace">
            Torna al negozio
          </Button>
        </TerminalPanel>
      </div>
    </>
  );
}
