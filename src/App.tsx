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
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="mt-8 font-display text-xl font-bold tracking-widest text-white/90 animate-pulse">AUTENTICANDO</h2>
        <p className="text-[10px] text-gray-500 mt-4 tracking-[0.3em] font-light uppercase">Sincronizando con Apolo Cloud</p>
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
