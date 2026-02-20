import React from 'react';

// This component is never rendered. It exists solely to force Tailwind to generate 
// the dynamic classes used in TaskCard.tsx and other components where classes 
// are constructed with string interpolation (e.g., `bg-${color}-500/10`).

export const Safelist: React.FC = () => {
    return (
        <div className="hidden">
            {/* INDIGO */}
            <div className="bg-indigo-500/5 bg-indigo-500/10 bg-indigo-500/20 bg-indigo-900/20 bg-indigo-900/40" />
            <div className="border-indigo-500/10 border-indigo-500/20 border-indigo-500/30 border-indigo-500/50" />
            <div className="text-indigo-400 text-indigo-500 from-indigo-500 to-indigo-900 shadow-indigo-900/20" />
            <div className="hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 group-hover:opacity-100" />

            {/* EMERALD */}
            <div className="bg-emerald-500/5 bg-emerald-500/10 bg-emerald-500/20 bg-emerald-900/20 bg-emerald-900/40" />
            <div className="border-emerald-500/10 border-emerald-500/20 border-emerald-500/30 border-emerald-500/50" />
            <div className="text-emerald-400 text-emerald-500 from-emerald-500 to-emerald-900 shadow-emerald-900/20" />
            <div className="hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:bg-emerald-500/20" />

            {/* ROSE */}
            <div className="bg-rose-500/5 bg-rose-500/10 bg-rose-500/20 bg-rose-900/20 bg-rose-900/40" />
            <div className="border-rose-500/10 border-rose-500/20 border-rose-500/30 border-rose-500/50" />
            <div className="text-rose-400 text-rose-500 from-rose-500 to-rose-900 shadow-rose-900/20" />
            <div className="hover:bg-rose-500/10 hover:border-rose-500/50 hover:bg-rose-500/20" />

            {/* AMBER */}
            <div className="bg-amber-500/5 bg-amber-500/10 bg-amber-500/20 bg-amber-900/20 bg-amber-900/40" />
            <div className="border-amber-500/10 border-amber-500/20 border-amber-500/30 border-amber-500/50" />
            <div className="text-amber-400 text-amber-500 from-amber-500 to-amber-900 shadow-amber-900/20" />
            <div className="hover:bg-amber-500/10 hover:border-amber-500/50 hover:bg-amber-500/20" />

            {/* CYAN */}
            <div className="bg-cyan-500/5 bg-cyan-500/10 bg-cyan-500/20 bg-cyan-900/20 bg-cyan-900/40" />
            <div className="border-cyan-500/10 border-cyan-500/20 border-cyan-500/30 border-cyan-500/50" />
            <div className="text-cyan-400 text-cyan-500 from-cyan-500 to-cyan-900 shadow-cyan-900/20" />
            <div className="hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:bg-cyan-500/20" />

            {/* VIOLET */}
            <div className="bg-violet-500/5 bg-violet-500/10 bg-violet-500/20 bg-violet-900/20 bg-violet-900/40" />
            <div className="border-violet-500/10 border-violet-500/20 border-violet-500/30 border-violet-500/50" />
            <div className="text-violet-400 text-violet-500 from-violet-500 to-violet-900 shadow-violet-900/20" />
            <div className="hover:bg-violet-500/10 hover:border-violet-500/50 hover:bg-violet-500/20" />

            {/* FUCHSIA */}
            <div className="bg-fuchsia-500/5 bg-fuchsia-500/10 bg-fuchsia-500/20 bg-fuchsia-900/20 bg-fuchsia-900/40" />
            <div className="border-fuchsia-500/10 border-fuchsia-500/20 border-fuchsia-500/30 border-fuchsia-500/50" />
            <div className="text-fuchsia-400 text-fuchsia-500 from-fuchsia-500 to-fuchsia-900 shadow-fuchsia-900/20" />
            <div className="hover:bg-fuchsia-500/10 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/20" />
        </div>
    );
};
