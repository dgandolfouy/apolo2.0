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

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const ctx = useContext(AppContext);
  // Check for auth callback in URL
  const isAuthCallback = window.location.hash.includes('access_token') ||
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('code');

  const [showSplash, setShowSplash] = useState(!isAuthCallback);

  React.useEffect(() => {
    // console.log("App: Auth State ->", { loading, user: user?.email, showSplash, isAuthCallback });

    if (!ctx) return;

    if (user) {
      // Only update if IDs match to avoid infinite loop
      if (ctx.currentUser?.id !== user.id) {
        console.log("App: Syncing Auth User to AppContext", user.email);
        ctx.setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          avatarColor: 'bg-indigo-500',
          avatarUrl: user.user_metadata?.avatar_url
        });
      }
    } else if (!user && ctx.currentUser) {
      // Handle Logout in App Context
      ctx.setCurrentUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ctx?.currentUser?.id]); // BREAK THE LOOP: Do not include 'ctx' here.

  if (!ctx) return null;

  // Debug Screen for Callback - Prevent dropping to IntroScreen if we have a hash
  if (isAuthCallback && !user) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full mb-4"></div>
        <h2 className="font-mono text-lg font-bold text-indigo-400">Procesando Login...</h2>
        <p className="text-xs text-gray-500 mt-2">Estamos validando tu sesión con Google.</p>

        <div className="mt-8 p-4 bg-gray-900 rounded border border-gray-800 max-w-lg w-full font-mono text-[10px] overflow-hidden">
          <p className="text-gray-400 mb-2">DEBUG INFO:</p>
          <p>Auth Callback Detected: <span className="text-green-400">YES</span></p>
          <p>User State: <span className="text-yellow-400">NULL (Waiting...)</span></p>
          <p className="mt-2 truncate opacity-50">Hash: {window.location.hash}</p>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 text-xs"
          >
            Reintentar
          </button>
          <button
            onClick={() => {
              window.location.href = window.location.pathname; // Clear hash
            }}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-xs"
          >
            Cancelar / Volver
          </button>
        </div>
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
