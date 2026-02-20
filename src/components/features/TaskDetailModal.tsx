import React, { useContext, useState, useRef, useEffect } from 'react';
import type { Task } from '../../types';
import { TaskStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';
import { Avatar } from '../ui/Avatar';
import { fileToBase64 } from '../../utils/helpers';
import { generateTaskSuggestions } from '../../services/geminiService';
import { ConfirmModal } from '../ui/ConfirmModal';

export const TaskDetailModal: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
    const ctx = useContext(AppContext);
    const [newComment, setNewComment] = useState('');
    const [activeTab, setActiveTab] = useState<'info' | 'ai'>('info');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDraggingAI, setIsDraggingAI] = useState(false);

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [aiContext, setAiContext] = useState(task.aiContext || '');
    const prevTaskIdRef = useRef(task.id);

    useEffect(() => {
        if (task.id !== prevTaskIdRef.current) {
            setTitle(task.title);
            setDescription(task.description || '');
            setAiContext(task.aiContext || '');
            prevTaskIdRef.current = task.id;
        }
    }, [task.id]);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const commentsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (commentsRef.current) commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }, [task.activity]);

    if (!ctx) return null;
    const project = ctx.state.projects.find(p => p.id === ctx.activeProjectId);

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            ctx.addActivity(task.id, newComment, 'comment');
            setNewComment('');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const base64 = await fileToBase64(file);
                ctx.addAttachment(task.id, 'document', file.name, base64);
            } catch (err) {
                alert("Error al subir archivo. Intenta con uno más pequeño.");
            }
        }
    };

    const handleAddLink = () => {
        if (linkUrl.trim()) {
            ctx.addAttachment(task.id, 'link', linkUrl, linkUrl);
            setLinkUrl('');
            setShowLinkInput(false);
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    ctx.addAttachment(task.id, 'audio', `Nota de voz ${new Date().toLocaleTimeString()}`, base64);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            alert("No se pudo acceder al micrófono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    const handleSaveComment = (logId: string) => {
        if (editingCommentText.trim()) {
            ctx.updateActivity(task.id, logId, editingCommentText);
            setEditingCommentId(null);
            setEditingCommentText('');
        }
    };

    const handleGenerateSuggestions = async () => {
        setIsGeneratingAI(true);
        const suggestions = await generateTaskSuggestions(
            task.title,
            task.description || '',
            aiContext || '',
            project?.title || '',
            task.aiMediaContext
        );
        ctx.updateTask(task.id, { suggestedSteps: suggestions });
        setIsGeneratingAI(false);
    }

    const handleProcessFile = (file: File) => {
        if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                ctx.updateTask(task.id, { aiContext: (task.aiContext || '') + `\n\n[ARCHIVO ${file.name}]:\n` + content });
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
                const newMedia = {
                    mimeType: file.type || 'application/octet-stream',
                    data: base64,
                    name: file.name
                };
                ctx.updateTask(task.id, {
                    aiMediaContext: [...(task.aiMediaContext || []), newMedia]
                });
            };
            reader.readAsDataURL(file);
        } else {
            alert("Formato no soportado. Usa texto, imágenes, PDF o video.");
        }
    };

    const handleDelete = () => {
        ctx.deleteTask(task.id);
        setConfirmDelete(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl bg-[#0F0F12] h-full shadow-2xl border-l border-white/5 flex flex-col animate-slide-left" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-start justify-between bg-[#0F0F12]/95 backdrop-blur z-10">
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${task.status === TaskStatus.COMPLETED ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                                {task.status === TaskStatus.COMPLETED ? 'Completada' : 'En Progreso'}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => {
                                if (title !== task.title) ctx.updateTask(task.id, { title });
                            }}
                            className="text-2xl font-display font-medium text-white hover:text-indigo-400 bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0 placeholder-gray-600"
                            placeholder="Título de la tarea"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setConfirmDelete(true)} className="p-2 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"><Icons.Delete size={18} /></button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Icons.Close size={20} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-8 border-b border-white/5">
                    <button onClick={() => setActiveTab('info')} className={`py-4 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>General</button>
                    <button onClick={() => setActiveTab('ai')} className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                        <Icons.Bot size={14} /> Inteligencia
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {activeTab === 'info' ? (
                        <>
                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Icons.File size={14} /> Descripción</h3>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={() => {
                                        if (description !== task.description) ctx.updateTask(task.id, { description });
                                    }}
                                    placeholder="Añadir descripción..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 text-sm focus:outline-none focus:border-indigo-500/50 min-h-[120px] resize-none"
                                />
                            </section>

                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Icons.Link size={14} /> Adjuntos ({task.attachments.length})</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-indigo-400 hover:text-indigo-300'}`}
                                        >
                                            <Icons.Audio size={14} /> {isRecording ? 'Detener' : 'Nota de Voz'}
                                        </button>
                                        <button onClick={() => setShowLinkInput(!showLinkInput)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Icons.Link size={14} /> Link</button>
                                        <label className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                            <Icons.Upload size={14} /> Archivo
                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>

                                {showLinkInput && (
                                    <div className="flex gap-2 mb-4 animate-fade-in">
                                        <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                        <button onClick={handleAddLink} className="bg-indigo-600 px-3 py-2 rounded-lg text-white text-xs font-bold">Agregar</button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {task.attachments.map(att => (
                                        <div key={att.id} className="group relative flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/10">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                                {att.type === 'link' ? <Icons.Link size={20} /> : att.type === 'audio' ? <Icons.Audio size={20} /> : <Icons.File size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-gray-200 truncate pr-6">{att.name}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(att.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('¿Borrar adjunto?')) ctx.deleteAttachment(task.id, att.id);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-400 bg-black/60 hover:bg-black/80 transition-colors rounded-lg z-30"
                                            >
                                                <Icons.Delete size={14} />
                                            </button>
                                            {att.type === 'audio' && (
                                                <audio controls src={att.url} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            )}
                                            {att.type === 'link' && <a href={att.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" />}
                                        </div>
                                    ))}
                                    {task.attachments.length === 0 && <div className="col-span-2 text-center py-4 border border-dashed border-white/10 rounded-xl text-gray-600 text-xs">Sin adjuntos</div>}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"><Icons.Book size={14} /> Actividad</h3>
                                <div className="bg-black/20 rounded-xl border border-white/5 p-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-4" ref={commentsRef}>
                                    {task.activity.map(log => {
                                        const user = ctx.users.find(u => u.id === log.createdBy);
                                        const isAuthor = log.createdBy === ctx.currentUser?.id;
                                        const isEditing = editingCommentId === log.id;

                                        return (
                                            <div key={log.id} className="flex gap-3 mb-4 last:mb-0 group/comment relative">
                                                <Avatar user={user} size="w-8 h-8" />
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between mb-1">
                                                        <span className="text-xs font-bold text-gray-300">{user?.name}</span>
                                                        <span className="text-[10px] text-gray-600">
                                                            {new Date(log.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                                                                ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : new Date(log.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                            }
                                                        </span>
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="mt-1">
                                                            <textarea
                                                                value={editingCommentText}
                                                                onChange={(e) => setEditingCommentText(e.target.value)}
                                                                className="w-full bg-black/40 border border-indigo-500/50 rounded-lg p-2 text-sm text-gray-200 focus:outline-none min-h-[60px]"
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400 hover:text-white">Cancelar</button>
                                                                <button onClick={() => handleSaveComment(log.id)} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">Guardar</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`text-sm whitespace-pre-wrap ${log.type === 'status_change' ? 'text-indigo-400 italic' : 'text-gray-400'}`}>
                                                            {log.content.split(' ').map((word: string, i: number) => {
                                                                if (word.startsWith('http')) {
                                                                    return <a key={i} href={word} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{word} </a>
                                                                }
                                                                return word + ' ';
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {isAuthor && log.type === 'comment' && !isEditing && (
                                                    <div className="absolute right-0 top-0 opacity-0 group-hover/comment:opacity-100 flex gap-1 bg-[#0F0F12] pl-2">
                                                        <button
                                                            onClick={() => { setEditingCommentId(log.id); setEditingCommentText(log.content); }}
                                                            className="p-1 text-gray-600 hover:text-indigo-400 transition-colors"
                                                        >
                                                            <Icons.Edit size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => ctx.deleteActivity(task.id, log.id)}
                                                            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                                                        >
                                                            <Icons.Delete size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <form onSubmit={handleAddComment} className="relative">
                                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Comentar..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-24 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                                    <div className="absolute right-12 top-2 flex items-center gap-1">
                                        <label className="p-1.5 text-gray-500 hover:text-indigo-400 cursor-pointer transition-colors">
                                            <Icons.Upload size={16} />
                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                        <button type="button" onClick={() => setShowLinkInput(!showLinkInput)} className={`p-1.5 transition-colors ${showLinkInput ? 'text-indigo-400' : 'text-gray-500 hover:text-indigo-400'}`}>
                                            <Icons.Link size={16} />
                                        </button>
                                    </div>
                                    <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50"><Icons.ArrowRight size={16} /></button>
                                </form>
                            </section>
                        </>
                    ) : (
                        <div className="space-y-6 animate-fade-in pb-10">
                            <div>
                                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                                    <Icons.Bot className="text-indigo-400" />
                                    Consultor de Tarea
                                </h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Sugerencias Estratégicas y Ejecución</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6">
                                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-300 mb-4">ENTRENAMIENTO ESPECÍFICO</h4>

                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="Pegar link técnico para esta tarea..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!linkUrl.trim()) return;
                                            setIsGeneratingAI(true);
                                            try {
                                                const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(linkUrl)}`);
                                                const data = await response.json();
                                                const textContent = data.contents.replace(/<[^>]*>?/gm, ' ').substring(0, 5000);
                                                ctx.updateTask(task.id, { aiContext: (task.aiContext || '') + `\n\n[LINK ${linkUrl}]:\n` + textContent });
                                                setLinkUrl('');
                                            } catch (e: any) {
                                                alert("No se pudo leer el link.");
                                            } finally {
                                                setIsGeneratingAI(false);
                                            }
                                        }}
                                        disabled={isGeneratingAI || !linkUrl.trim()}
                                        className="px-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl text-xs font-bold border border-indigo-500/20 disabled:opacity-30 transition-all"
                                    >
                                        LEER
                                    </button>
                                </div>

                                <div
                                    className={`relative transition-all rounded-xl ${isDraggingAI ? 'scale-[1.01]' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDraggingAI(true); }}
                                    onDragLeave={() => setIsDraggingAI(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDraggingAI(false);
                                        const file = e.dataTransfer.files[0];
                                        if (file) handleProcessFile(file);
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base de Conocimiento</h4>
                                        <div className="flex gap-2">
                                            <input type="file" id="ai-file-upload" className="hidden" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleProcessFile(file);
                                            }} />
                                            <label htmlFor="ai-file-upload" className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-[9px] font-bold border border-indigo-500/20 transition-all cursor-pointer">
                                                <Icons.Upload size={12} />
                                                SUBIR ARCHIVO
                                            </label>
                                        </div>
                                    </div>

                                    {task.aiMediaContext && task.aiMediaContext.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {task.aiMediaContext.map((media, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2 py-1">
                                                    <span className="text-[10px] text-indigo-300 font-medium truncate max-w-[120px]">{media.name}</span>
                                                    <button onClick={() => {
                                                        const updated = task.aiMediaContext?.filter((_, i) => i !== idx);
                                                        ctx.updateTask(task.id, { aiMediaContext: updated });
                                                    }} className="text-indigo-400 hover:text-red-400 transition-colors">
                                                        <Icons.Close size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <textarea
                                            value={aiContext}
                                            onChange={(e) => setAiContext(e.target.value)}
                                            onBlur={() => {
                                                if (aiContext !== (task.aiContext || '')) {
                                                    ctx.updateTask(task.id, { aiContext });
                                                }
                                            }}
                                            placeholder="Pega contenido o arrastra archivos..."
                                            className={`w-full bg-black/40 border rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 min-h-[140px] resize-none custom-scrollbar transition-all ${isDraggingAI ? 'border-indigo-500 border-dashed ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/20' : 'border-white/10'}`}
                                        />
                                        {isDraggingAI && (
                                            <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none z-10 animate-pulse">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icons.Bot size={32} className="text-indigo-400" />
                                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Suelta para Analizar</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleGenerateSuggestions}
                                    disabled={isGeneratingAI}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/20 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isGeneratingAI ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.Bot size={20} />}
                                    <span className="tracking-wide">GENERAR ESTRATEGIA DE EJECUCIÓN</span>
                                </button>
                            </div>

                            {task.suggestedSteps && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in shadow-inner relative group mt-6">
                                    <div className="absolute top-4 right-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Respuesta IA</div>
                                    <h4 className="text-xs font-bold text-white mb-6 uppercase tracking-[0.2em] opacity-40">Plan Recomendado</h4>
                                    <div className="prose prose-invert prose-sm max-w-none space-y-4">
                                        {task.suggestedSteps.split('\n').filter(line => line.trim()).map((line, i) => (
                                            <div key={i} className="flex gap-4 items-start bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                                <p className="text-gray-300 leading-relaxed m-0">{line.replace(/^-\s*/, '')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDelete}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title="Eliminar Tarea"
                message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};
