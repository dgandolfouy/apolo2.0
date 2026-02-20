import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';
import { getStrategicAdvice } from '../../services/geminiService';

export const AIModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [trainingContext, setTrainingContext] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [fetchingUrl, setFetchingUrl] = useState(false);
    const [showTraining, setShowTraining] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [mediaParts, setMediaParts] = useState<{ mimeType: string; data: string; name: string }[]>([]);

    const ctx = useContext(AppContext);

    if (!ctx) return null;

    const activeProject = ctx.state.projects.find(p => p.id === ctx.activeProjectId);
    const contextStr = activeProject
        ? `Proyecto Activo: ${activeProject.title} (${activeProject.subtitle}). Tareas actuales: ${activeProject.tasks.map(t => t.title).join(', ')}.`
        : "Sin proyecto activo seleccionado en el dashboard.";

    const handleFetchUrl = async () => {
        if (!urlInput.trim()) return;
        setFetchingUrl(true);
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`);
            const data = await response.json();
            const textContent = data.contents.replace(/<[^>]*>?/gm, ' ').substring(0, 5000);
            setTrainingContext(prev => `${prev}\n\n[CONTENIDO DE ${urlInput}]:\n${textContent}`);
            setUrlInput('');
            setShowTraining(true);
        } catch (e) {
            alert("No se pudo leer el link. Prueba copiando el texto manualmente.");
        } finally {
            setFetchingUrl(false);
        }
    };

    const handleProcessFile = (file: File) => {
        if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setTrainingContext(prev => `${prev}\n\n[DOCUMENTO: ${file.name}]:\n${content}`);
                setShowTraining(true);
            };
            reader.readAsText(file);
        } else if (file.type.includes('image/') || file.type === 'application/pdf' || file.type.includes('video/')) {
            if (file.size > 10 * 1024 * 1024) {
                alert("El archivo es demasiado grande (máx 10MB para IA)");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setMediaParts(prev => [...prev, {
                    mimeType: file.type || 'application/octet-stream',
                    data: base64,
                    name: file.name
                }]);
                setShowTraining(true);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Formato no soportado. Usa texto, imágenes, PDF o video.");
        }
    };

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const res = await getStrategicAdvice(contextStr, query, trainingContext, mediaParts);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#111115] border border-indigo-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl shadow-indigo-900/20 animate-slide-up flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 tracking-wide">
                            <Icons.Bot className="text-indigo-400" />
                            Consultor Acción IA
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Socio Estratégico para Ejecución</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><Icons.Close /></button>
                </div>

                {/* Training Context Area */}
                <div className={`mb-4 transition-all duration-300 ${showTraining ? 'max-h-[300px]' : 'h-10'} overflow-hidden bg-white/5 rounded-xl border border-white/10`}>
                    <button
                        onClick={() => setShowTraining(!showTraining)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-white/5 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Icons.Triangle size={10} className={`transition-transform ${showTraining ? 'rotate-180' : 'rotate-90'}`} />
                            CONFIGURAR ENTRENAMIENTO / CONTEXTO ADICIONAL
                        </span>
                        {!showTraining && (trainingContext || mediaParts.length > 0) && <span className="text-[10px] text-emerald-400">Contexto Activo</span>}
                    </button>
                    {showTraining && (
                        <div
                            className={`p-4 pt-0 transition-colors ${isDragging ? 'bg-indigo-500/10' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files[0]) handleProcessFile(e.dataTransfer.files[0]);
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex gap-2 flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="Pegar link..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-indigo-500/50"
                                    />
                                    <button
                                        onClick={handleFetchUrl}
                                        disabled={fetchingUrl || !urlInput.trim()}
                                        className="px-3 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-lg text-[10px] font-bold disabled:opacity-30 border border-white/10 whitespace-nowrap"
                                    >
                                        {fetchingUrl ? 'LEYENDO...' : 'LEER LINK'}
                                    </button>
                                </div>
                                <div className="flex shrink-0">
                                    <input type="file" id="global-ai-upload" className="hidden" onChange={(e) => {
                                        if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                                    }} />
                                    <label htmlFor="global-ai-upload" className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-[9px] font-bold border border-indigo-500/20 transition-all cursor-pointer">
                                        <Icons.Upload size={12} />
                                        SUBIR ARCHIVO
                                    </label>
                                </div>
                            </div>

                            {/* Multi-modal previews */}
                            {mediaParts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {mediaParts.map((media, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-0.5 group/media relative">
                                            <span className="text-[9px] text-indigo-300 font-medium truncate max-w-[100px]">{media.name}</span>
                                            <button
                                                onClick={() => setMediaParts(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-indigo-400 hover:text-red-400 transition-colors"
                                            >
                                                <Icons.Close size={8} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative group">
                                <textarea
                                    value={trainingContext}
                                    onChange={(e) => setTrainingContext(e.target.value)}
                                    placeholder="Pega información técnica o arrastra archivos..."
                                    className={`w-full h-24 bg-black/40 border rounded-lg p-3 text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50 resize-none custom-scrollbar transition-all ${isDragging ? 'border-indigo-500 border-dashed ring-2 ring-indigo-500/20 shadow-lg' : 'border-white/10'}`}
                                />
                                {isDragging && (
                                    <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] rounded-lg flex items-center justify-center pointer-events-none z-10 animate-pulse">
                                        <div className="flex flex-col items-center gap-1">
                                            <Icons.Bot size={24} className="text-indigo-400" />
                                            <span className="text-[9px] font-bold text-indigo-300 uppercase">Suelta para Analizar</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    {response ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20 text-gray-200 leading-relaxed shadow-inner">
                                {response.split('\n').filter(line => line.trim()).map((line, i) => (
                                    <div key={i} className="mb-3 flex gap-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                        <p className="flex-1">{line.replace(/^-\s*/, '')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                <Icons.Bot className="w-8 h-8 text-indigo-400 opacity-60" />
                            </div>
                            <h4 className="text-white font-bold mb-2">¿Cómo puedo ayudarte a avanzar?</h4>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto"> Define un contexto de estudio arriba o simplemente pregunta algo estratégico sobre tu proyecto.</p>
                        </div>
                    )}
                </div>

                {/* Question Input */}
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                        placeholder="Pregunta algo: ¿Qué sigue? ¿Cómo optimizo esto?..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 shadow-lg"
                        disabled={loading}
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-2 p-2.5 bg-indigo-600 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-500 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.ArrowRight size={20} />}
                    </button>
                </div>
            </div>
        </div>
    )
}
