import React, { useContext, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, AppContext } from './context/AppContext';
import { IntroScreen } from './components/features/IntroScreen';
import { ProjectsList } from './components/features/ProjectsList';
import { ProjectView } from './components/features/ProjectView';
import { InputModal } from './components/ui/InputModal';
import { AIModal } from './components/features/AIModal';
import { StatsModal } from './components/features/StatsModal';
import { ProfileModal } from './components/features/ProfileModal';
import { TaskDetailModal } from './components/features/TaskDetailModal';
import { SplashScreen } from './components/features/SplashScreen';
import { Icons } from './components/ui/Icons';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const ctx = useContext(AppContext);
  // Precise check for auth callback
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  const isAuthCallback = !!(hashParams.get('access_token') ||
    hashParams.get('type') === 'recovery' ||
    params.get('code'));

  const authError = params.get('error_description') || params.get('error') || hashParams.get('error_description');

  const [showSplash, setShowSplash] = useState(!isAuthCallback && !authError);

  React.useEffect(() => {
    if (!ctx || !user) {
      if (!user && ctx?.currentUser) ctx.setCurrentUser(null);
      return;
    }

    if (ctx.currentUser?.id !== user.id) {
      ctx.setCurrentUser({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        avatarColor: 'bg-indigo-500',
        avatarUrl: user.user_metadata?.avatar_url
      });
    }
  }, [user, ctx]);

  if (!ctx) return null;

  // Handle Auth Errors
  if (authError && !user) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <Icons.Close size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-widest uppercase">Error de Autenticación</h2>
        <p className="text-gray-400 text-center max-w-md mb-8 font-light text-sm">
          {authError.replace(/\+/g, ' ')}
        </p>
        <button
          onClick={() => {
            const invite = params.get('invite');
            window.location.href = invite ? `${window.location.pathname}?invite=${invite}` : window.location.pathname;
          }}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all font-medium"
        >
          Volver a Intentar
        </button>
      </div>
    );
  }

  // Debug Screen for Callback
  if (isAuthCallback && !user) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="mt-8 font-display text-xl font-bold tracking-widest text-white/90 animate-pulse uppercase">Autenticando</h2>
        <p className="text-[10px] text-gray-400 mt-4 tracking-[0.3em] font-light uppercase">Sincronizando con Apolo Cloud</p>
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <IntroScreen />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      {ctx.activeProjectId ? <ProjectView /> : <ProjectsList />}

      {/* Global Modals */}
      {ctx.modalConfig && (
        <InputModal
          title={ctx.modalConfig.title}
          onClose={() => ctx.setModalConfig(null)}
          onSubmit={ctx.modalConfig.callback}
        />
      )}
      {ctx.showAI && <AIModal onClose={() => ctx.setShowAI(false)} />}
      {ctx.showStats && <StatsModal onClose={() => ctx.setShowStats(false)} />}
      {ctx.showProfile && <ProfileModal onClose={() => ctx.setShowProfile(false)} />}
      {ctx.activeTask && <TaskDetailModal task={ctx.activeTask} onClose={() => ctx.setActiveTask(null)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
