/** Il registro dei movimenti: ingressi, ruoli, reparti, uscite. */

import { db, ensureCarriera } from './nucleo';

/* ─── Il registro della carriera ─────────────────────────────
   Chi entra, chi cambia ruolo, chi cambia reparto.

   Questo registro non serviva a nessuna schermata dell'app: un profilo
   mostra il ruolo di adesso, non quelli di prima. Serve invece
   all'osservatorio, che di mestiere guarda i movimenti — e un movimento,
   se nessuno lo scrive quando succede, non si ricostruisce piu'.

   Si scrive in un punto solo, dove i cambiamenti passano davvero:
   `addUser` per chi arriva, `updateUser` per chi si sposta. Scriverlo
   invece nelle venti schermate che chiamano `updateUser` vorrebbe dire
   che prima o poi una se ne dimentica.

   Chi esce non c'e': l'app non ha modo di disattivare un account, quindi
   non c'e' niente da registrare. Quando ci sara', il posto e' questo. */


export const getCarriera = () => {
  ensureCarriera();
  return db.carriera;
};

let carrieraSeq = 0;
export function segnaCarriera(persona, tipo, da, a) {
  ensureCarriera();
  carrieraSeq += 1;
  db.carriera.push({
    id: `car-${Date.now()}-${carrieraSeq}`,
    userId: persona.id,
    orgId: persona.orgId ?? null,
    tipo,
    da: da ?? null,
    a: a ?? null,
    il: new Date().toISOString(),
  });
}
