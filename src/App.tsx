import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppSelector } from '@/store/hooks'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import OfficeLayout from '@/pages/office/OfficeLayout'
import ChatPage from '@/pages/office/ChatPage'
import AgentPage from '@/pages/office/AgentPage'
import SettingsPage from '@/pages/office/SettingsPage'
import KnowledgePage from '@/pages/office/KnowledgePage'
import DatasetsPage from './pages/office/DatasetsPage'
import InboxPage from './pages/office/InboxPage'
import MeetingsPage from '@/pages/office/MeetingsPage'
import OrganizationPage from '@/pages/office/OrganizationPage'
import ToolsPage from '@/pages/office/ToolsPage'
import ProjectsPage from '@/pages/office/ProjectsPage'
import ProjectPage from '@/pages/office/ProjectPage'
import WelcomePage from '@/pages/WelcomePage'
import JoinPage from '@/pages/JoinPage'
import TrailPage from '@/pages/trail/TrailPage'
import StationPage from '@/pages/trail/StationPage'
import StationDocumentPage from '@/pages/trail/StationDocumentPage'
import TelaoPage from '@/pages/trail/TelaoPage'
import PilotPage from '@/pages/trail/PilotPage'
import PlanPage from '@/pages/trail/PlanPage'
import FichasPage from '@/pages/trail/FichasPage'
import { homeFor } from '@/lib/session'

function RequireAuth() {
  const token = useAppSelector((s) => s.auth.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Logado mas sem organização ativa: boas-vindas (entrar com código / criar). */
function RequireOrg() {
  const companyId = useAppSelector((s) => s.auth.user?.companyId)
  if (!companyId) return <Navigate to="/welcome" replace />
  return <Outlet />
}

function RequireOnboardingDone() {
  const status = useAppSelector((s) => s.auth.onboardingStatus)
  if (status !== 'COMPLETED') return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** Participantes do evento ficam na trilha; o painel é de quem organiza. */
function RequireOrganizer() {
  const role = useAppSelector((s) => s.auth.user?.role)
  if (role === 'MEMBER') return <Navigate to="/trilha" replace />
  return <Outlet />
}

function GuestOnly() {
  const { token, user, onboardingStatus } = useAppSelector((s) => s.auth)
  if (token && user) return <Navigate to={homeFor({ user, onboardingStatus: onboardingStatus ?? undefined })} replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Toaster position="top-center" richColors toastOptions={{ style: { fontFamily: 'Inter, Arial, sans-serif' } }} />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* convite: abre com ou sem login (sem login, guarda e volta depois) */}
        <Route path="/join/:code" element={<JoinPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route element={<RequireOrg />}>
          <Route path="/trilha" element={<TrailPage />} />
          <Route path="/trilha/mapa" element={<TrailPage map />} />
          <Route path="/trilha/piloto" element={<PilotPage />} />
          <Route path="/trilha/plano" element={<PlanPage />} />
          <Route path="/trilha/estacao/:n" element={<StationPage />} />
          <Route path="/trilha/estacao/:n/documento" element={<StationDocumentPage />} />
          <Route element={<RequireOrganizer />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<RequireOnboardingDone />}>
            <Route path="/telao" element={<TelaoPage />} />
            <Route path="/telao/fichas" element={<FichasPage />} />
            <Route path="/office" element={<OfficeLayout />}>
              <Route index element={<ChatPage />} />
              <Route path="c/:conversationId" element={<ChatPage />} />
              <Route path="agents/:id" element={<AgentPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="org" element={<OrganizationPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="data" element={<DatasetsPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="meetings" element={<MeetingsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/office" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
