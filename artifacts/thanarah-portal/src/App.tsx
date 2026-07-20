import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthGuard, AdminGuard } from './components/Guards';
import { PageTransition } from './components/PageTransition';
import { SplashScreen } from './components/SplashScreen';

// Public Pages
import Login from './pages/Login';
import Setup from './pages/Setup';
import VisitRequest from './pages/VisitRequest';
import ResetPassword from './pages/ResetPassword';
import InviteAccept from './pages/InviteAccept';
import ErrorPage from './pages/ErrorPage';
import NotFound from '@/pages/not-found';

// Auth Pages
import Dashboard from './pages/Dashboard';
import PresentationHome from './pages/PresentationHome';
import PresentationViewer from './pages/PresentationViewer';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersAdmin from './pages/admin/UsersAdmin';
import InvitationsAdmin from './pages/admin/InvitationsAdmin';
import SessionsAdmin from './pages/admin/SessionsAdmin';
import SecurityEventsAdmin from './pages/admin/SecurityEventsAdmin';
import AuditLogsAdmin from './pages/admin/AuditLogsAdmin';
import ContentAdmin from './pages/admin/ContentAdmin';
import VisitsAdmin from './pages/admin/VisitsAdmin';
import SystemHealthAdmin from './pages/admin/SystemHealthAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/setup" component={Setup} />
      <Route path="/visit-request" component={VisitRequest} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/invite/expired" component={() => <ErrorPage type="expired" />} />
      <Route path="/invite/revoked" component={() => <ErrorPage type="revoked" />} />
      <Route path="/access-denied" component={() => <ErrorPage type="denied" />} />
      <Route path="/invite" component={InviteAccept} />

      {/* Authenticated Routes */}
      <Route path="/dashboard">
        <AuthGuard><Dashboard /></AuthGuard>
      </Route>
      <Route path="/presentation">
        <AuthGuard><PresentationHome /></AuthGuard>
      </Route>
      <Route path="/presentation/:section">
        <AuthGuard><PresentationViewer /></AuthGuard>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <AdminGuard><AdminDashboard /></AdminGuard>
      </Route>
      <Route path="/admin/users">
        <AdminGuard><UsersAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/invitations">
        <AdminGuard><InvitationsAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/sessions">
        <AdminGuard><SessionsAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/security-events">
        <AdminGuard><SecurityEventsAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/audit-logs">
        <AdminGuard><AuditLogsAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/content">
        <AdminGuard><ContentAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/visits">
        <AdminGuard><VisitsAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/system-health">
        <AdminGuard><SystemHealthAdmin /></AdminGuard>
      </Route>
      <Route path="/admin/settings">
        <AdminGuard><SettingsAdmin /></AdminGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [splash, setSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <TooltipProvider>
              {/* App renders underneath — auth check runs during splash */}
              <PageTransition>
                <Router />
              </PageTransition>
              <Toaster />
              {/* Splash sits on top, unmounts after animation */}
              {splash && <SplashScreen onDone={() => setSplash(false)} />}
            </TooltipProvider>
          </AuthProvider>
        </WouterRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
