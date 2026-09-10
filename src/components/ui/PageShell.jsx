import HelpButton from './HelpButton';

/**
 * Intestazione di pagina: il titolo nella sua pillola e, se c'è, la
 * descrizione in un pannello sotto — la coppia che ricorre nei mockup.
 *
 * Il titolo e' di primo grado: e' il nome della schermata, e prima nessuna
 * pagina ne aveva uno — si partiva dal secondo, come un capitolo senza titolo
 * di libro sopra.
 *
 * Nella pillola sta anche il "?" della guida: e' l'unico posto presente in
 * ogni schermata, quindi la posizione resta la stessa dappertutto senza
 * doverla ripetere pagina per pagina. Dove non c'e' una guida scritta, il
 * pulsante non compare da solo.
 */
export default function PageShell({ title, description, action }) {
  return (
    <header>
      <div className="ui-title-riga">
        <h1 className="ui-title">{title}</h1>
        <HelpButton />
      </div>
      {description && (
        <div className="ui-panel" style={{ margin: '0 14px 16px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>{description}</p>
        </div>
      )}
      {action && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 14px 16px' }}>
          {action}
        </div>
      )}
    </header>
  );
}
