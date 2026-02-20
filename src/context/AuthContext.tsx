import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout to force loading=false if Supabase hangs
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("AuthContext: Safety timeout triggered. Forcing loading=false.");
                setLoading(false);
            }
        }, 5000);

        const initSession = async () => {
            try {
                console.log("AuthContext: Checking session...");

                // 1. Try standard getSession
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    console.log("AuthContext: Session found via getSession", session.user.email);
                    setUser(session.user);
                    setLoading(false);
                    return;
                }

                // 2. If no session, check for Hash (Implicit Flow Manual Override)
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    console.log("AuthContext: Token found in hash, attempting manual setSession...");

                    const params = new URLSearchParams(hash.substring(1)); // Remove #
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { data: manualData, error: manualError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token
                        });

                        if (manualError) {
                            console.error("AuthContext: Manual setSession failed", manualError);
                            window.alert("Manual Session Error: " + manualError.message);
                        } else if (manualData.session) {
                            console.log("AuthContext: Manual session success!", manualData.session.user.email);
                            setUser(manualData.session.user);
                            window.location.hash = ''; // Clear hash to clean URL
                        }
                    }
                }
            } catch (err) {
                console.error("AuthContext: Session check failed", err);
            } finally {
                setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        // Run init
        initSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AuthContext: Auth State Change ->", _event, session?.user?.email);
            if (session?.user) {
                setUser(session.user);
                setLoading(false);
            } else if (_event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const signInWithGoogle = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    skipBrowserRedirect: true
                }
            });

            if (error) {
                console.error("Error logging in:", error.message);
                window.alert("ERROR Supabase: " + error.message);
            } else if (data?.url) {
                console.log("Redirecting manually to:", data.url);
                window.location.href = data.url;
            } else {
                window.alert("Error: No se recibió URL de redirección de Supabase.");
            }
        } catch (e: any) {
            console.error("Exception logging in:", e);
            window.alert("CRASH Login: " + (e.message || JSON.stringify(e)));
        }
    };

    const signOut = async () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("SignOut error (ignored):", e);
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
