import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { getUserById, getStorico } from '../../data/db';
import { competenzeDi, achievementDi } from '../../data/talenti';
import { livelloById } from '../../data/skillsCatalog';

/**
 * Lo storico lavorativo: dove si e' stati, e che cosa si e' portato via.
 *
 * Quando si cambia organizzazione il profilo riparte da zero — quest,
 * competenze certificate, achievement — e questa e' la pagina che spiega
 * perche' quel ritorno a zero non e' una perdita. Quello che si e' fatto in
 * un'azienda con l'abbonamento resta qui, con la data, per sempre; e resta
 * valido per farsi trovare, che e' il punto.
 *
 * XP e livello non ci sono, e non sono nemmeno stati azzerati: restano alla
 * persona e crescono per tutta la sua vita su Achivia, in qualunque azienda
 * — anche in una senza abbonamento. Sono un saldo, non un giudizio, e in una
 * pagina che parla di quello che sai fare non hanno niente da dire.
 *
 * Le organizzazioni senza abbonamento non ci sono, e non e' una svista: chi
 * ha lavorato li' quei risultati li ha persi davvero, nel momento in cui e'
 * uscito. Mostrare una riga vuota col nome dell'azienda sarebbe peggio che
 * non mostrarla — direbbe "c'e' qualcosa qui" a proposito di niente.
 *
 * Una competenza certificata da due datori di lavoro diversi compare due
 * volte, ognuna con la sua data. Non e' un doppione: sono due persone
 * diverse che, in due momenti diversi, hanno detto la stessa cosa di te.
 */
const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');
const mese = (iso) => (iso
  ? new Date(iso).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })
  : '—');

export default function StoricoLavorativoPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const [aperta, setAperta] = useState(null);

  const passaggi = getStorico()
    .filter((s) => s.userId === me?.id)
    .sort((a, b) => new Date(b.a) - new Date(a.a));
  const competenze = competenzeDi(me?.id);
  const achievement = achievementDi(me?.id);

  const scelta = passaggi.find((p) => p.id === aperta) || null;
  const sue = scelta ? competenze.filter((c) => c.orgId === scelta.orgId) : [];

  return (
    <div className="page">
      <PageShell
        title="Storico lavorativo"
        description="Quello che hai ottenuto nelle organizzazioni con abbonamento. Resta tuo anche quando cambi azienda, e vale per farti trovare."
      />

      <div className="ui-corpo-pagina">
        {passaggi.length === 0 ? (
          <TerminalPanel titolo="ANCORA NIENTE" className="ui-blocco con-stacco">
            <p className="tv-vuoto">
              {me?.orgId
                ? 'Sei ancora nella tua prima organizzazione: lo storico si riempie quando ne esci.'
                : 'Non risulta nessun passaggio in un’organizzazione con abbonamento.'}
            </p>
          </TerminalPanel>
        ) : (
          <TerminalPanel
            titolo="DOVE HAI LAVORATO"
            meta={`${passaggi.length} ${passaggi.length === 1 ? 'organizzazione' : 'organizzazioni'}`}
            className="ui-blocco con-stacco"
          >
            <TerminalRows
              ariaLabel="Le organizzazioni in cui hai lavorato"
              attivo={aperta}
              onSceglie={(id) => setAperta(id === aperta ? null : id)}
              voci={passaggi.map((p) => ({
                id: p.id,
                label: p.nomeOrg,
                valore: `${mese(p.da)} → ${mese(p.a)}`,
              }))}
            />
          </TerminalPanel>
        )}

        {scelta && (
          <TerminalPanel
            titolo={scelta.nomeOrg.toUpperCase()}
            piede={`${giorno(scelta.da)} → ${giorno(scelta.a)}`}
            className="ui-blocco con-stacco"
          >
            <TerminalRows
              vivo
              voci={[
                ['Quest portate a termine', scelta.questChiuse],
                ['Colleghi aiutati', scelta.aiuti],
              ]}
            />
            <div className="tv-riga" aria-hidden="true" />
            <span className="label">Competenze certificate qui</span>
            {sue.length === 0 ? (
              <p className="tv-vuoto">Nessuna competenza certificata in questa organizzazione.</p>
            ) : (
              <TerminalRows
                voci={sue.map((c) => [
                  `${c.nome} · ${livelloById(c.livello)?.label || c.livello}`,
                  giorno(c.certificatoIl),
                ])}
              />
            )}
          </TerminalPanel>
        )}

        {competenze.length > 0 && (
          <TerminalPanel
            titolo="TUTTE LE COMPETENZE CHE TI PORTI DIETRO"
            meta={`${competenze.length}`}
            className="ui-blocco con-stacco"
          >
            <TerminalRows
              voci={competenze.map((c) => [
                `${c.nome} · ${livelloById(c.livello)?.label || c.livello}`,
                `${c.organizzazione} · ${giorno(c.certificatoIl)}`,
              ])}
            />
          </TerminalPanel>
        )}

        {achievement.length > 0 && (
          <TerminalPanel
            titolo="ACHIEVEMENT CHE RESTANO"
            meta={`${achievement.length}`}
            className="ui-blocco con-stacco"
          >
            <TerminalRows
              voci={achievement.map((a) => [
                a.nome,
                a.quante > 1 ? `${a.quante} volte` : giorno(a.ultimo),
              ])}
            />
          </TerminalPanel>
        )}
      </div>

    </div>
  );
}
