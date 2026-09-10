import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import InCima from './components/InCima';
import PezzoMancante from './components/PezzoMancante';
import RequireAuth from './components/RequireAuth';
import SoloTavola from './components/SoloTavola';
import SoloPersone from './components/SoloPersone';
import AuthLayout from './components/layouts/AuthLayout';
import AdminLayout from './components/layouts/AdminLayout';
import ManagerLayout from './components/layouts/ManagerLayout';
import EmployeeLayout from './components/layouts/EmployeeLayout';
import PixelLayout from './components/layouts/PixelLayout';
import ShopLayout from './components/layouts/ShopLayout';

/* Auth */
import SplashPage from './pages/auth/SplashPage';
import AuthChoicePage from './pages/auth/AuthChoicePage';
import RegFormNewPage from './pages/auth/RegFormNewPage';
import OrgTypeChoicePage from './pages/auth/OrgTypeChoicePage';
import OrgFormCompanyPage from './pages/auth/OrgFormCompanyPage';
import OrgFormPersonalizzataPage from './pages/auth/OrgFormPersonalizzataPage';
import RegFormJoinPage from './pages/auth/RegFormJoinPage';
import AccountLockedPage from './pages/auth/AccountLockedPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

/* Negozio */
import OsservatorioLayout from './components/layouts/OsservatorioLayout';

/* Il Castello */
import CastelloLayout from './components/layouts/CastelloLayout';
import PolsoPage from './pages/castello/PolsoPage';
import CastelloOrganizzazioniPage from './pages/castello/OrganizzazioniPage';
import ListinoPage from './pages/castello/ListinoPage';
import OffertePage from './pages/castello/OffertePage';
import CrmPage from './pages/castello/CrmPage';
import AccessiPage from './pages/castello/AccessiPage';
import LevePage from './pages/castello/LevePage';
import PubblicitaPage from './pages/castello/PubblicitaPage';
import PagamentiPage from './pages/castello/PagamentiPage';
import CastelloMenuPage from './pages/castello/MenuPage';
import MercatoHomePage from './pages/osservatorio/MercatoHomePage';
import CompetenzePage from './pages/osservatorio/CompetenzePage';
import MobilitaPage from './pages/osservatorio/MobilitaPage';
import AnnunciMercatoPage from './pages/osservatorio/AnnunciMercatoPage';
import TalentiPage from './pages/osservatorio/TalentiPage';
import TrovaLavoroPage from './pages/lavoro/TrovaLavoroPage';
import FattiTrovarePage from './pages/lavoro/FattiTrovarePage';
import StoricoLavorativoPage from './pages/lavoro/StoricoLavorativoPage';
import SelezionaOrgPage from './pages/shared/SelezionaOrgPage';
import DirittiPage from './pages/lavoro/DirittiPage';
import AnnunciPage from './pages/lavoro/AnnunciPage';
import ShopHomePage from './pages/shop/ShopHomePage';
import ShopArticoliPage from './pages/shop/ShopArticoliPage';
import ShopOrdiniPage from './pages/shop/ShopOrdiniPage';
import ShopCassaPage from './pages/shop/ShopCassaPage';

/* Admin */
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import CompraCreditiPage from './pages/shared/CompraCreditiPage';
import PianiPage from './pages/admin/PianiPage';
import CassaPage from './pages/admin/CassaPage';
import AdminAnnunciPage from './pages/admin/AdminAnnunciPage';
import AdminIngressiPage from './pages/admin/AdminIngressiPage';

/* Manager */
import ManagerProfilePage from './pages/manager/ManagerProfilePage';
import EmblemaPage from './pages/manager/EmblemaPage';
import ManagementPage from './pages/manager/ManagementPage';
import TeamsPage from './pages/manager/TeamsPage';
import TeamDetailPage from './pages/manager/TeamDetailPage';
import TeamEditPage from './pages/manager/TeamEditPage';
import PersonePage from './pages/manager/PersonePage';
import SkillsPage from './pages/manager/SkillsPage';
import AchievementsPage from './pages/manager/AchievementsPage';
import TimeAttendancePage from './pages/manager/TimeAttendancePage';
import ReviewNewPage from './pages/manager/ReviewNewPage';
import ReviewHistoryPage from './pages/manager/ReviewHistoryPage';
import EmployeeDetailPage from './pages/manager/EmployeeDetailPage';
import QuestsHubPage from './pages/manager/QuestsHubPage';
import QuestNewPage from './pages/manager/QuestNewPage';
import QuestExpiringPage from './pages/manager/QuestExpiringPage';
import QuestActivePage from './pages/manager/QuestActivePage';
import QuestApprovePage from './pages/manager/QuestApprovePage';
import QuestSavedPage from './pages/manager/QuestSavedPage';
import HelpRequestsPage from './pages/manager/HelpRequestsPage';
import ProjectsPage from './pages/manager/ProjectsPage';
import ProjectNewPage from './pages/manager/ProjectNewPage';
import ProjectDetailPage from './pages/manager/ProjectDetailPage';

/* Employee */
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';
import MyQuestsPage from './pages/employee/MyQuestsPage';
import MySkillsPage from './pages/employee/MySkillsPage';
import MyAchievementsPage from './pages/employee/MyAchievementsPage';
import EmployeeAnalyticsPage from './pages/employee/EmployeeAnalyticsPage';
import EmployeeHelpPage from './pages/employee/EmployeeHelpPage';

/* Condivise */
import CustomizePage from './pages/shared/CustomizePage';
import DataPage from './pages/shared/DataPage';
import MenuPage from './pages/shared/MenuPage';
import MarketplacePage from './pages/shared/MarketplacePage';
import LeaderboardPage from './pages/shared/LeaderboardPage';
import OrgVetrinaPage from './pages/shared/OrgVetrinaPage';
import PurchasesPage from './pages/shared/PurchasesPage';
import SettingsPage from './pages/shared/SettingsPage';
import CasellaPage from './pages/shared/CasellaPage';
import StaticAboutPage from './pages/shared/StaticAboutPage';
import StaticCreditsInfoPage from './pages/shared/StaticCreditsInfoPage';
import StaticFaqPage from './pages/shared/StaticFaqPage';
import StaticHelpPage from './pages/shared/StaticHelpPage';
import StaticPrivacyPage from './pages/shared/StaticPrivacyPage';
import StaticTermsPage from './pages/shared/StaticTermsPage';

/* L'arena: il gioco. Sono le uniche due pagine caricate a parte, e per una
   ragione misurata: il motore e le sue immagini pesano, e li paga solo chi
   entra. Il primo `lazy()` dell'app. */
import { ArenaPagePigra as ArenaPage, PartitaPagePigra as PartitaPage, TraguardiArenaPagePigra as TraguardiArenaPage, ClassificaArenaPagePigra as ClassificaArenaPage } from './pages/arena/pigre';
import GiochiPage from './pages/giochi/GiochiPage';
/* Lexora: stesso ragionamento dell'arena. Cinque dizionari pesano, e
   li carica solo chi gioca a parole. */
import {
  LexoraPagePigra as LexoraPage, PartitaLexoraPagePigra as PartitaLexoraPage,
  TraguardiLexoraPagePigra as TraguardiLexoraPage, ClassificaLexoraPagePigra as ClassificaLexoraPage,
  TheBossPagePigra as TheBossPage, CreditiTheBossPagePigra as CreditiTheBossPage,
  PartitaTheBossPagePigra as PartitaTheBossPage, ClassificaTheBossPagePigra as ClassificaTheBossPage,
  TheClimbPagePigra as TheClimbPage, PartitaTheClimbPagePigra as PartitaTheClimbPage,
  EnciclopediaTheClimbPagePigra as EnciclopediaTheClimbPage, ClassificaTheClimbPagePigra as ClassificaTheClimbPage,
} from './pages/giochi/pigre';
import { giocoAcceso } from './data/giochi/catalogo';
const attesa = <p className="tv-nota" style={{ padding: 'var(--space-4)' }}>&gt;&gt; Carico l’arena…</p>;
const attesaParole = <p className="tv-nota" style={{ padding: 'var(--space-4)' }}>&gt;&gt; Carico il dizionario…</p>;
const attesaUfficio = <p className="tv-nota" style={{ padding: 'var(--space-4)' }}>&gt;&gt; Apro l’ufficio…</p>;

/* The Boss e' in lavorazione: finche' il suo interruttore e' spento le sue
   rotte non esistono proprio, non sono solo nascoste. Una schermata a meta'
   raggiungibile scrivendo l'indirizzo a mano e' comunque una schermata a
   meta' che qualcuno vede. L'interruttore sta in `data/giochi/catalogo.js`. */
const rotteTheBoss = giocoAcceso('theboss') ? [
  { path: '/giochi/the-boss', element: <SoloPersone><Suspense fallback={attesaUfficio}><TheBossPage /></Suspense></SoloPersone> },
  { path: '/giochi/the-boss/crediti', element: <SoloPersone><Suspense fallback={attesaUfficio}><CreditiTheBossPage /></Suspense></SoloPersone> },
  { path: '/giochi/the-boss/classifica', element: <SoloPersone><Suspense fallback={attesaUfficio}><ClassificaTheBossPage /></Suspense></SoloPersone> },
] : [];
const rottaPartitaTheBoss = giocoAcceso('theboss')
  ? [{ path: '/giochi/the-boss/partita', element: <SoloPersone><Suspense fallback={attesaUfficio}><PartitaTheBossPage /></Suspense></SoloPersone> }]
  : [];

/* The Climb: stesso interruttore, stessa ragione. L'atrio sta con la
   barra, la partita senza: e' una schermata lunga che si scorre. */
const attesaScalata = <p className="tv-nota" style={{ padding: 'var(--space-4)' }}>&gt;&gt; Riprendo la settimana…</p>;
const rotteTheClimb = giocoAcceso('theclimb') ? [
  { path: '/giochi/the-climb', element: <SoloPersone><Suspense fallback={attesaScalata}><TheClimbPage /></Suspense></SoloPersone> },
  { path: '/giochi/the-climb/enciclopedia', element: <SoloPersone><Suspense fallback={attesaScalata}><EnciclopediaTheClimbPage /></Suspense></SoloPersone> },
  { path: '/giochi/the-climb/classifica', element: <SoloPersone><Suspense fallback={attesaScalata}><ClassificaTheClimbPage /></Suspense></SoloPersone> },
] : [];
const rottaPartitaTheClimb = giocoAcceso('theclimb')
  ? [{ path: '/giochi/the-climb/partita', element: <SoloPersone><Suspense fallback={attesaScalata}><PartitaTheClimbPage /></Suspense></SoloPersone> }]
  : [];

const router = createBrowserRouter(
  [
    // Un livello senza indirizzo attorno a tutto: non cambia nessun URL e
    // non aggiunge niente al disegno: e' solo il posto da cui ogni pagina
    // viene riportata in cima quando si apre.
    {
      element: <InCima />,
      // La rete sotto tutta l'app. Serve soprattutto ai giochi, che sono
      // le uniche pagine caricate a parte: dopo una pubblicazione il
      // pezzo che chiedono puo' non esistere piu'. Vedi
      // `lib/pezziMancanti.js`.
      errorElement: <PezzoMancante />,
      children: [
    { path: '/', element: <SplashPage /> },

    {
      path: '/auth',
      element: <AuthLayout />,
      children: [
        { index: true, element: <AuthChoicePage /> },
        { path: 'locked', element: <AccountLockedPage /> },
        { path: 'reset-password', element: <ResetPasswordPage /> },
        { path: 'register/org-choice', element: <RegFormNewPage /> },
        { path: 'register/org-type', element: <OrgTypeChoicePage /> },
        { path: 'register/org/company', element: <OrgFormCompanyPage /> },
        /* "personalizzata" e non "private": e' come si chiama adesso questo
           tipo di organizzazione, e l'indirizzo e' la prima cosa che uno
           legge quando qualcosa non torna. */
        { path: 'register/org/personalizzata', element: <OrgFormPersonalizzataPage /> },
        { path: 'register/join', element: <RegFormJoinPage /> },
      ],
    },

    {
      path: '/admin',
      element: <RequireAuth role="admin"><AdminLayout /></RequireAuth>,
      children: [
        { index: true, element: <AdminHomePage /> },
        { path: 'users', element: <AdminUsersPage /> },
        // Chi entra: e' la porta di casa, e ha una schermata sua.
        { path: 'ingressi', element: <AdminIngressiPage /> },
        { path: 'users/:id', element: <AdminUserDetailPage /> },
        { path: 'roles', element: <AdminRolesPage /> },
        { path: 'departments', element: <AdminDepartmentsPage /> },
        { path: 'settings', element: <AdminSettingsPage /> },
        { path: 'settings/piani', element: <PianiPage /> },
        { path: 'cassa', element: <CassaPage /> },
        { path: 'data', element: <DataPage /> },
        // La bacheca del personale: la riempiono l'admin e i co-admin, e
        // sta qui perche' e' una cosa dell'organizzazione verso fuori, non
        // una gestione del team.
        { path: 'annunci', element: <AdminAnnunciPage /> },
        { path: 'skills', element: <SkillsPage /> },
        { path: 'achievements', element: <AchievementsPage /> },
        { path: 'attendance', element: <TimeAttendancePage /> },
      ],
    },

    {
      path: '/manager',
      element: <RequireAuth role="manager"><ManagerLayout /></RequireAuth>,
      children: [
        { index: true, element: <Navigate to="/manager/profile" replace /> },
        { path: 'profile', element: <ManagerProfilePage /> },
        { path: 'customize', element: <CustomizePage /> },
        // L'insegna dell'organizzazione: ci arriva l'admin dal suo profilo.
        { path: 'emblema', element: <EmblemaPage /> },
        { path: 'management', element: <ManagementPage /> },
        { path: 'management/employees', element: <PersonePage /> },
        { path: 'management/employees/:id', element: <EmployeeDetailPage /> },
        { path: 'management/employees/:id/review', element: <ReviewNewPage /> },
        { path: 'management/employees/:id/reviews', element: <ReviewHistoryPage /> },
        { path: 'management/teams', element: <TeamsPage /> },
        { path: 'management/teams/new', element: <TeamEditPage /> },
        { path: 'management/teams/:id', element: <TeamDetailPage /> },
        { path: 'management/teams/:id/edit', element: <TeamEditPage /> },
        /* «Dipendenti» e «Membri» erano due schermate che facevano la stessa
           cosa e ognuna con qualcosa che all'altra mancava: adesso sono una
           sola. Il vecchio indirizzo ci porta dentro invece di sparire — i
           collegamenti scritti in giro continuano a funzionare. */
        { path: 'management/members', element: <Navigate to="/manager/management/employees" replace /> },
        { path: 'management/skills', element: <SkillsPage /> },
        { path: 'management/quests', element: <QuestsHubPage /> },
        { path: 'management/quests/new', element: <QuestNewPage /> },
        { path: 'management/quests/expiring', element: <QuestExpiringPage /> },
        { path: 'management/quests/active', element: <QuestActivePage /> },
        { path: 'management/quests/approve', element: <QuestApprovePage /> },
        { path: 'management/quests/saved', element: <QuestSavedPage /> },
        { path: 'management/help-requests', element: <HelpRequestsPage /> },
        { path: 'management/projects', element: <ProjectsPage /> },
        { path: 'management/projects/new', element: <ProjectNewPage /> },
        { path: 'management/projects/:id', element: <ProjectDetailPage /> },
        { path: 'data', element: <DataPage /> },
        { path: 'achievements', element: <AchievementsPage /> },
        { path: 'attendance', element: <TimeAttendancePage /> },
        { path: 'notifications', element: <Navigate to="/messaggi" replace /> },
        { path: 'menu', element: <MenuPage /> },
      ],
    },

    // Il negozio e' un'area a se': ci si entra solo con un accesso al
    // negozio, e da dentro non si arriva alle schermate delle
    // organizzazioni. Gli accessi si consegnano a mano, non si creano
    // dall'app (vedi `RUOLI_APERTI` in `db.js`).
    {
      path: '/shop',
      element: <RequireAuth role="shop"><ShopLayout /></RequireAuth>,
      children: [
        { index: true, element: <ShopHomePage /> },
        { path: 'articoli', element: <ShopArticoliPage /> },
        { path: 'ordini', element: <ShopOrdiniPage /> },
        { path: 'cassa', element: <ShopCassaPage /> },
      ],
    },

    // L'osservatorio e' un'area a se', come il negozio: ci si entra solo
    // con un accesso dell'osservatorio, e da dentro non si arriva a
    // nessuna schermata di nessuna organizzazione. Gli accessi si
    // consegnano a mano, non si creano dall'app (vedi `RUOLI_APERTI` in
    // `db.js`).
    {
      path: '/osservatorio',
      element: <RequireAuth role="osservatorio"><OsservatorioLayout /></RequireAuth>,
      children: [
        { index: true, element: <SoloTavola tavola="mercato"><MercatoHomePage /></SoloTavola> },
        { path: 'competenze', element: <SoloTavola tavola="competenze"><CompetenzePage /></SoloTavola> },
        { path: 'profili', element: <SoloTavola tavola="profili"><TalentiPage /></SoloTavola> },
        { path: 'mobilita', element: <SoloTavola tavola="mobilita"><MobilitaPage /></SoloTavola> },
        // La domanda di lavoro. Sta qui e non fra le pagine condivise
        // perche' e' una tavola di mercato, non la bacheca: guarda gli
        // annunci in blocco, non uno alla volta.
        { path: 'annunci', element: <SoloTavola tavola="annunci"><AnnunciMercatoPage /></SoloTavola> },
      ],
    },

    /* IL CASTELLO — la dashboard con cui si tiene in piedi l'applicazione.
       Terza area fuori dalle organizzazioni, e l'ultima: l'accesso si
       consegna a mano come per il negozio e per l'osservatorio, e da dentro
       non si arriva a nessuna schermata di nessuna insegna. */
    {
      path: '/castle',
      element: <RequireAuth role="castle"><CastelloLayout /></RequireAuth>,
      children: [
        { index: true, element: <PolsoPage /> },
        { path: 'organizzazioni', element: <CastelloOrganizzazioniPage /> },
        { path: 'listino', element: <ListinoPage /> },
        { path: 'offerte', element: <OffertePage /> },
        { path: 'crm', element: <CrmPage /> },
        { path: 'pagamenti', element: <PagamentiPage /> },
        { path: 'pubblicita', element: <PubblicitaPage /> },
        { path: 'accessi', element: <AccessiPage /> },
        { path: 'leve', element: <LevePage /> },
        { path: 'menu', element: <CastelloMenuPage /> },
      ],
    },

    {
      path: '/employee',
      element: <RequireAuth role="employee"><EmployeeLayout /></RequireAuth>,
      children: [
        { index: true, element: <Navigate to="/employee/profile" replace /> },
        { path: 'profile', element: <EmployeeProfilePage /> },
        { path: 'customize', element: <CustomizePage /> },
        { path: 'quests', element: <MyQuestsPage /> },
        { path: 'skills', element: <MySkillsPage /> },
        { path: 'achievements', element: <MyAchievementsPage /> },
        { path: 'analytics', element: <EmployeeAnalyticsPage /> },
        { path: 'help', element: <EmployeeHelpPage /> },
        { path: 'org', element: <PersonePage /> },
        { path: 'notifications', element: <Navigate to="/messaggi" replace /> },
        { path: 'menu', element: <MenuPage /> },
      ],
    },

    // Le partite, a tutto schermo e senza barra. Sono le uniche tre pagine
    // dell'app senza navigazione, ed e' voluto: una barra sopra un gioco
    // che si gioca a tempo e' un modo di uscirne per sbaglio. Si esce dal
    // gioco, e dal gioco si torna nel suo atrio.
    {
      element: <PixelLayout />,
      children: [
        { path: '/arena/partita', element: <SoloPersone><Suspense fallback={attesa}><PartitaPage /></Suspense></SoloPersone> },
        { path: '/giochi/lexora/partita', element: <SoloPersone><Suspense fallback={attesaParole}><PartitaLexoraPage /></Suspense></SoloPersone> },
        ...rottaPartitaTheBoss,
        ...rottaPartitaTheClimb,
      ],
    },

    // Le pagine che tengono la navigazione dell'app — la barra in basso sul
    // telefono, la colonna a sinistra da scrivania. Non e' un privilegio:
    // e' la differenza fra una commissione e un posto. Da una commissione
    // si torna indietro e basta (compilare un modulo, leggere i termini),
    // in un posto ci si sta, e da li' si vuole poter andare altrove senza
    // prima uscire.
    //
    // La lega c'e' perche' e' la vetrina di Achivia e non di un ruolo. Ci
    // sono poi le schermate che si aprono da un riquadro del profilo — il
    // negozio, la casella — e la sezione di chi cerca lavoro:
    // la bacheca si scorre, la casella si legge, il catalogo si guarda, e
    // nessuna di queste si apre per fare una cosa sola e andarsene.
    //
    // Il negozio e l'osservatorio restano fuori dove `SoloPersone` li tiene
    // fuori: non sono profili di persone, non comprano e non cercano
    // lavoro. La barra e' quella dell'area di chi guarda, quindi chi arriva
    // dal profilo dipendente ritrova le voci del dipendente.
    //
    // Il riquadro "Indietro" lo mette il guscio, una volta sola. Queste
    // pagine ne avevano uno loro e se ne trovavano due in fondo.
    {
      element: <PixelLayout conBarra />,
      children: [
        // La scelta del canale sta fra le pagine condivise perche' non e'
        // di nessuna area: ci si arriva dal menu di qualunque profilo, e da
        // li' si entra in un'organizzazione in cui si e' un'altra cosa.
        { path: '/org', element: <SoloPersone><SelezionaOrgPage /></SoloPersone> },
        { path: '/leaderboard', element: <LeaderboardPage /> },
        { path: '/leaderboard/:orgId', element: <OrgVetrinaPage /> },
        { path: '/annunci', element: <SoloPersone><AnnunciPage /></SoloPersone> },
        // Una casella sola. I due vecchi indirizzi ci portano dentro invece
        // di sparire: i collegamenti scritti in giro continuano a
        // funzionare, e stanno accanto alla pagina a cui puntano.
        { path: '/messaggi', element: <SoloPersone><CasellaPage /></SoloPersone> },
        { path: '/messaging', element: <Navigate to="/messaggi" replace /> },
        { path: '/lavoro/messaggi', element: <Navigate to="/messaggi" replace /> },
        { path: '/marketplace', element: <SoloPersone><MarketplacePage /></SoloPersone> },
        // L'atrio dell'arena: un posto in cui si sta, con la barra. Il riquadro
        // "Indietro" porta al profilo, non alla pagina di prima (vedi
        // `PixelLayout`): prima di solito c'e' la partita appena finita.
        // Games: la porta dei giochi. L'arena non si e' spostata di un file —
        // vive dov'era — si e' spostato il punto da cui ci si arriva.
        { path: '/giochi', element: <SoloPersone><GiochiPage /></SoloPersone> },
        { path: '/arena', element: <SoloPersone><Suspense fallback={attesa}><ArenaPage /></Suspense></SoloPersone> },
        { path: '/arena/traguardi', element: <SoloPersone><Suspense fallback={attesa}><TraguardiArenaPage /></Suspense></SoloPersone> },
        { path: '/arena/classifica', element: <SoloPersone><Suspense fallback={attesa}><ClassificaArenaPage /></Suspense></SoloPersone> },
        { path: '/giochi/lexora', element: <SoloPersone><Suspense fallback={attesaParole}><LexoraPage /></Suspense></SoloPersone> },
        { path: '/giochi/lexora/traguardi', element: <SoloPersone><Suspense fallback={attesaParole}><TraguardiLexoraPage /></Suspense></SoloPersone> },
        { path: '/giochi/lexora/classifica', element: <SoloPersone><Suspense fallback={attesaParole}><ClassificaLexoraPage /></Suspense></SoloPersone> },
        ...rotteTheBoss,
        ...rotteTheClimb,
        { path: '/marketplace/purchases', element: <SoloPersone><PurchasesPage /></SoloPersone> },
        { path: '/lavoro', element: <SoloPersone><TrovaLavoroPage /></SoloPersone> },
        { path: '/lavoro/fatti-trovare', element: <SoloPersone><FattiTrovarePage /></SoloPersone> },
        { path: '/storico-lavorativo', element: <SoloPersone><StoricoLavorativoPage /></SoloPersone> },
        { path: '/i-miei-dati', element: <SoloPersone><DirittiPage /></SoloPersone> },

        /* Queste otto stavano fuori, senza barra, perche' erano
           "commissioni": ci si entra per una cosa sola e si torna
           indietro. Ma senza barra la commissione diventa un vicolo: da
           «Termini di servizio» l'unico modo di andare al proprio profilo
           era il pulsante Indietro, e da «Impostazioni» pure. La barra e'
           quella di chi guarda — `tabsPer` la sceglie — e chi non e'
           entrato continua a non averla, che e' giusto: i termini si
           leggono anche dalla schermata di accesso.

           Il negozio e l'osservatorio non passano da `SoloPersone`: una
           spiegazione di crediti che non hanno e' un vicolo cieco, che e'
           un modo piu' lento di far perdere tempo. */
        { path: '/credits-info', element: <SoloPersone><StaticCreditsInfoPage /></SoloPersone> },
        // Comprare crediti e' di tutti: si spendono nel negozio, che sta
        // fuori dalle organizzazioni e vale per chiunque.
        { path: '/compra-crediti', element: <SoloPersone><CompraCreditiPage /></SoloPersone> },
        // Le impostazioni servono a tutti: la musica, la password,
        // l'uscita. Non sono di un'organizzazione, sono dell'account.
        { path: '/settings', element: <SettingsPage /> },
        { path: '/help', element: <StaticHelpPage /> },
        { path: '/faq', element: <StaticFaqPage /> },
        { path: '/about', element: <StaticAboutPage /> },
        { path: '/terms', element: <StaticTermsPage /> },
        { path: '/privacy', element: <StaticPrivacyPage /> },
      ],
    },

    { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') }
);

export default router;
