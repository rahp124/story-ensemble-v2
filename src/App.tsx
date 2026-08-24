import { useEffect, useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { UserLandingPage } from './components/UserLandingPage';
import { HomePage } from './components/HomePage';
import { UserFlow } from './components/UserFlow';
import { DesignerFlow } from './components/DesignerFlow';
import { EvaluateFlow } from './components/EvaluateFlow';
import { AdminSetup } from './components/AdminSetup';
import { useStore } from './store';
import { fetchSession, logout } from './lib/accessSession';
import { navigate, useRoute } from './lib/route';

type AccessStatus = 'loading' | 'authenticated' | 'anonymous';

export default function App() {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');

  const route = useRoute();
  const hasCompletedLanding = useStore((s) => s.hasCompletedLanding);
  const adminSetupOpen = useStore((s) => s.adminSetupOpen);
  const setAccessId = useStore((s) => s.setAccessId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchSession();
        if (cancelled) return;
        if (session) {
          setAccessId(session.accessId);
          setAccessStatus('authenticated');
        } else {
          setAccessId(null);
          setAccessStatus('anonymous');
        }
      } catch {
        if (cancelled) return;
        setAccessId(null);
        setAccessStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAccessId]);

  const handleLoginSuccess = (accessId: string) => {
    setAccessId(accessId);
    setAccessStatus('authenticated');
  };

  const handleStartOver = async () => {
    try {
      await logout();
    } catch {
      // Still reset local state even if logout request fails
    }
    useStore.setState({
      nodes: [],
      edges: [],
      studyEvents: [],
      accessId: null,
      hasCompletedLanding: false,
      hasCompletedOverview: false,
      hasCompletedCharacterCreation: false,
      characterProfile: null,
      designerSelectedVariantId: null,
      priorExperience: null,
      experienceDescription: ''
    });
    navigate('home');
    setAccessStatus('anonymous');
  };

  if (accessStatus === 'loading') {
    return (
      <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-500">
        Checking access…
      </div>
    );
  }

  if (accessStatus === 'anonymous') {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-[100vh] w-[100vw]">
      {route === 'evaluate' && <EvaluateFlow />}
      {route !== 'evaluate' && !hasCompletedLanding && (
        <UserLandingPage onComplete={() => { /* store flip drives re-render */ }} />
      )}
      {route !== 'evaluate' && hasCompletedLanding && route === 'home' && (
        <HomePage />
      )}
      {route !== 'evaluate' && hasCompletedLanding && route === 'user' && (
        <UserFlow onStartOver={handleStartOver} />
      )}
      {route !== 'evaluate' && hasCompletedLanding && route === 'designer' && (
        <DesignerFlow onStartOver={handleStartOver} />
      )}
      {adminSetupOpen && <AdminSetup />}
    </div>
  );
}
