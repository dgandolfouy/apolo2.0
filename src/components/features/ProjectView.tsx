import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';
import { searchTasks, getProjectProgress, fileToBase64 } from '../../utils/helpers';
import { TaskCard } from './TaskCard';
import { NotificationCenter } from './NotificationCenter';

export const ProjectView: React.FC = () => {
    const ctx = useContext(AppContext);
    if (!ctx || !ctx.activeProjectId) return null;

    const project = ctx.state.projects.find(p => p.id === ctx.activeProjectId);
    if (!project) return null;

    const visibleTasks = ctx.searchQuery ? searchTasks(project.tasks, ctx.searchQuery) : project.tasks;
    const activeTasks = visibleTasks.filter(t => !t.is_archived);
    const archivedTasks = visibleTasks.filter(t => t.is_archived);
    const progress = getProjectProgress(project);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                ctx.updateProject(project.id, { imageUrl: base64 });
            } catch (e) {
                alert("Error al subir imagen. Prueba con una más pequeña.");
            }
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#050505]">
            <header className="flex-none px-4 md:px-8 py-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => ctx.setActiveProjectId(null)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Icons.Close size={20} /></button>
                        <div className="flex items-center gap-4">
                            <label className="group cursor-pointer relative">
                                {project.imageUrl ? (
                                    <img src={project.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-lg" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-lg">
                                        <Icons.Camera size={20} className="text-indigo-400" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icons.Settings size={16} className="text-white" />
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-4">
                                    <h1
                                        className="text-2xl md:text-3xl font-display font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer leading-tight"
                                        onClick={() => ctx.requestInput("Nombre del Proyecto", (title) => ctx.updateProject(project.id, { title }))}
                                    >
                                        {project.title}
                                    </h1>
                                    <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-1.5 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                        <span className="text-lg font-bold text-white tabular-nums">{progress}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-sm italic font-light">{project.subtitle || "Sin descripción"}</span>
                                    <button
                                        className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                        onClick={() => {
                                            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                                            if (isLocal) {
                                                const proceed = window.confirm("⚠️ ESTÁS EN MODO LOCAL (localhost)\n\nEl enlace generado SOLO funcionará en TU computadora. Si envías este enlace a otra persona, NO podrá abrirlo.\n\n¿Deseas continuar de todas formas para probar en tu equipo?");
                                                if (!proceed) return;
                                            }

                                            const url = `${window.location.origin}?invite=${project.id}`;
                                            const text = `¡Hola! Te invito a colaborar en el proyecto "${project.title}" en Apolo. Únete aquí: ${url}`;
                                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                            window.open(whatsappUrl, '_blank');
                                        }}
                                    >
                                        <Icons.Share size={10} /> Invitar
                                    </button>

                                    {/* Participants List */}
                                    <div className="flex items-center -space-x-2 ml-4">
                                        {ctx.projectMembers.map((member, i) => (
                                            <div
                                                key={member.id}
                                                className={`w-7 h-7 rounded-full border-2 border-[#050505] flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-lg transition-transform hover:translate-y-[-2px] hover:z-10 cursor-help ${member.avatarColor}`}
                                                title={member.name}
                                                style={{ zIndex: ctx.projectMembers.length - i }}
                                            >
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        ))}
                                        {ctx.projectMembers.length === 0 && (
                                            <div className="text-[10px] text-gray-600 font-light italic ml-2">Solo tú</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row items-center gap-4 flex-1 justify-end w-full">
                        <div className="relative w-full max-w-sm group">
                            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                            <input type="text" placeholder="Buscar tareas..." value={ctx.searchQuery} onChange={(e) => ctx.setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-light" />
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block"></div>
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            <NotificationCenter />
                            <button onClick={ctx.openStatsModal} className="p-2.5 rounded-2xl hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 transition-colors relative group">
                                <Icons.Chart size={20} />
                            </button>
                            <button onClick={ctx.openAIModal} className="p-2.5 rounded-2xl hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors relative group">
                                <Icons.Bot size={20} />
                            </button>
                            <button onClick={() => ctx.requestInput("Nueva Tarea Principal", (title) => ctx.addTask(null, title))} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/40 whitespace-nowrap active:scale-95">
                                <Icons.Add size={18} /> <span className="inline">Tarea</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-4 pb-20">
                    {activeTasks.length === 0 && archivedTasks.length === 0 ? (
                        <div className="text-center py-20 opacity-30">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.File size={40} /></div>
                            <p className="text-xl">No hay tareas pendientes</p>
                            <button onClick={() => ctx.addTask(null, "Primera tarea")} className="mt-4 text-indigo-400 hover:text-indigo-300">Crear la primera tarea</button>
                        </div>
                    ) : (
                        <>
                            {activeTasks.map((task, i) => <TaskCard key={task.id} task={task} depth={0} themeIndex={i} />)}

                            {archivedTasks.length > 0 && (
                                <div className="mt-12 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-4 mb-6 opacity-40">
                                        <div className="h-px flex-1 bg-white/10"></div>
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                            <Icons.Archive size={14} />
                                            Tareas Archivadas / Terminadas ({archivedTasks.length})
                                        </h3>
                                        <div className="h-px flex-1 bg-white/10"></div>
                                    </div>
                                    <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                        {archivedTasks.map((task, i) => <TaskCard key={task.id} task={task} depth={0} themeIndex={i} />)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}
