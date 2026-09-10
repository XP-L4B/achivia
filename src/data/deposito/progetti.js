/** Progetti e squadre. */

import { db, ensureProjects, ensureTeams, save } from './nucleo';

/* ─── Progetti ───────────────────────────────────────────────
   Progetti creati da un manager con dipendenti assegnati. */

let projectSeq = 0;
export function addProject(project) {
  ensureProjects();
  projectSeq += 1;
  const created = {
    id: `p-${Date.now()}-${projectSeq}`,
    status: 'attivo',
    createdAt: new Date().toISOString(),
    ...project,
  };
  db.projects.unshift(created);
  save();
  return created;
}

export const getProjectsByManager = (managerId) => {
  ensureProjects();
  return db.projects.filter((p) => p.managerId === managerId);
};

export const getProjectById = (id) => {
  ensureProjects();
  return db.projects.find((p) => p.id === id) || null;
};

// Progetti a cui un dipendente è assegnato come membro.
export const getProjectsForMember = (userId) => {
  ensureProjects();
  return db.projects.filter((p) => (p.memberIds ?? []).includes(userId));
};

// Quest assegnate a un progetto.

/* ─── Team ───────────────────────────────────────────────────
   I team sono entità vere: si creano, si rinominano e hanno una lista di
   membri. Prima esisteva solo il campo `department` sull'utente, un testo
   libero: al primo avvio lo convertiamo in team, così i dati esistenti non
   si perdono e le due cose non convivono a metà. */

export const getTeamsByOrg = (orgId) => {
  ensureTeams();
  return db.teams.filter((t) => t.orgId === orgId);
};

export const getTeamById = (id) => {
  ensureTeams();
  return db.teams.find((t) => t.id === id) || null;
};

// Team di cui l'utente fa parte.
export const getTeamsForUser = (userId) => {
  ensureTeams();
  return db.teams.filter((t) => (t.memberIds ?? []).includes(userId));
};

let teamSeq = 0;
export function addTeam({ orgId, name, createdById, memberIds = [] }) {
  ensureTeams();
  teamSeq += 1;
  const created = {
    id: `t-${Date.now()}-${teamSeq}`,
    orgId,
    name,
    createdById,
    memberIds: [...memberIds],
    createdAt: new Date().toISOString(),
  };
  db.teams.push(created);
  syncDepartments(created);
  save();
  return created;
}

export function updateTeam(id, patch) {
  ensureTeams();
  const t = db.teams.find((x) => x.id === id);
  if (!t) return null;
  Object.assign(t, patch);
  syncDepartments(t);
  save();
  return t;
}

export function deleteTeam(id) {
  ensureTeams();
  const t = db.teams.find((x) => x.id === id);
  if (!t) return;
  // I membri non spariscono con il team: restano nell'organizzazione.
  t.memberIds.forEach((uid) => {
    const u = db.users.find((x) => x.id === uid);
    if (u && u.department === t.name) u.department = '';
  });
  db.teams = db.teams.filter((x) => x.id !== id);
  save();
}

export function addTeamMember(teamId, userId) {
  ensureTeams();
  const t = db.teams.find((x) => x.id === teamId);
  if (!t || t.memberIds.includes(userId)) return t;
  t.memberIds.push(userId);
  syncDepartments(t);
  save();
  return t;
}

export function removeTeamMember(teamId, userId) {
  ensureTeams();
  const t = db.teams.find((x) => x.id === teamId);
  if (!t) return null;
  t.memberIds = t.memberIds.filter((id) => id !== userId);
  const u = db.users.find((x) => x.id === userId);
  if (u && u.department === t.name) u.department = '';
  save();
  return t;
}

// Tiene allineato il vecchio campo `department`, ancora usato dai filtri e
// mostrato nelle schede, al team di appartenenza.
function syncDepartments(team) {
  team.memberIds.forEach((uid) => {
    const u = db.users.find((x) => x.id === uid);
    if (u) u.department = team.name;
  });
}
