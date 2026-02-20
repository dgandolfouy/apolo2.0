export const TASK_THEMES = [
    { name: 'Indigo', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', hover: 'hover:border-indigo-500/50', text: 'text-indigo-400' },
    { name: 'Emerald', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', hover: 'hover:border-emerald-500/50', text: 'text-emerald-400' },
    { name: 'Rose', border: 'border-rose-500/30', bg: 'bg-rose-500/10', hover: 'hover:border-rose-500/50', text: 'text-rose-400' },
    { name: 'Amber', border: 'border-amber-500/30', bg: 'bg-amber-500/10', hover: 'hover:border-amber-500/50', text: 'text-amber-400' },
    { name: 'Cyan', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', hover: 'hover:border-cyan-500/50', text: 'text-cyan-400' },
    { name: 'Violet', border: 'border-violet-500/30', bg: 'bg-violet-500/10', hover: 'hover:border-violet-500/50', text: 'text-violet-400' },
    { name: 'Fuchsia', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10', hover: 'hover:border-fuchsia-500/50', text: 'text-fuchsia-400' },
    { name: 'Sky', border: 'border-sky-500/30', bg: 'bg-sky-500/10', hover: 'hover:border-sky-500/50', text: 'text-sky-400' },
    { name: 'Lime', border: 'border-lime-500/30', bg: 'bg-lime-500/10', hover: 'hover:border-lime-500/50', text: 'text-lime-400' },
];

export const PROJECT_COLORS = {
    indigo: "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.1)]",
    emerald: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    rose: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]",
    amber: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]",
    cyan: "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)]",
    violet: "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.1)]",
    fuchsia: "bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.1)]",
};

export const PROJECT_THEMES = Object.values(PROJECT_COLORS);

// SAFELIST FOR RECURSIVE TASKS (Forces Tailwind to generate these classes)
// Root: /20, Subtask: /15, Deep: /10
export const TAILWIND_SAFELIST = [
    // Indigo
    "bg-indigo-500/40", "bg-indigo-500/30", "bg-indigo-500/25", "bg-indigo-500/20", "bg-indigo-500/15", "bg-indigo-500/10", "bg-indigo-900/40",
    // Emerald
    "bg-emerald-500/40", "bg-emerald-500/30", "bg-emerald-500/25", "bg-emerald-500/20", "bg-emerald-500/15", "bg-emerald-500/10", "bg-emerald-900/40",
    // Rose
    "bg-rose-500/40", "bg-rose-500/30", "bg-rose-500/25", "bg-rose-500/20", "bg-rose-500/15", "bg-rose-500/10", "bg-rose-900/40",
    // Amber
    "bg-amber-500/40", "bg-amber-500/30", "bg-amber-500/25", "bg-amber-500/20", "bg-amber-500/15", "bg-amber-500/10", "bg-amber-900/40",
    // Cyan
    "bg-cyan-500/40", "bg-cyan-500/30", "bg-cyan-500/25", "bg-cyan-500/20", "bg-cyan-500/15", "bg-cyan-500/10", "bg-cyan-900/40",
    // Violet
    "bg-violet-500/40", "bg-violet-500/30", "bg-violet-500/25", "bg-violet-500/20", "bg-violet-500/15", "bg-violet-500/10", "bg-violet-900/40",
    // Fuchsia
    "bg-fuchsia-500/40", "bg-fuchsia-500/30", "bg-fuchsia-500/25", "bg-fuchsia-500/20", "bg-fuchsia-500/15", "bg-fuchsia-500/10", "bg-fuchsia-900/40",
    // Sky
    "bg-sky-500/40", "bg-sky-500/30", "bg-sky-500/25", "bg-sky-500/20", "bg-sky-500/15", "bg-sky-500/10", "bg-sky-900/40",
    // Lime
    "bg-lime-500/40", "bg-lime-500/30", "bg-lime-500/25", "bg-lime-500/20", "bg-lime-500/15", "bg-lime-500/10", "bg-lime-900/40",

    // Gradients & Borders (Safelist for dynamic interpolation)
    "from-indigo-500", "to-indigo-900", "border-indigo-500/50", "border-indigo-500/30",
    "from-emerald-500", "to-emerald-900", "border-emerald-500/50", "border-emerald-500/30",
    "from-rose-500", "to-rose-900", "border-rose-500/50", "border-rose-500/30",
    "from-amber-500", "to-amber-900", "border-amber-500/50", "border-amber-500/30",
    "from-cyan-500", "to-cyan-900", "border-cyan-500/50", "border-cyan-500/30",
    "from-violet-500", "to-violet-900", "border-violet-500/50", "border-violet-500/30",
    "from-fuchsia-500", "to-fuchsia-900", "border-fuchsia-500/50", "border-fuchsia-500/30",
    "from-sky-500", "to-sky-900", "border-sky-500/50", "border-sky-500/30",
    "from-lime-500", "to-lime-900", "border-lime-500/50", "border-lime-500/30",
];
