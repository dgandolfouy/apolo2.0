import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppState, User, Task, Project, ActivityLog, Attachment } from '../types';
import { TaskStatus, USERS } from '../types';
import { generateId, findTaskAndAddSubtask, findTaskAndUpdate, findTaskAndDelete, getRandomColor, findTask, findTaskAndParent } from '../utils/helpers';
import { supabase } from '../lib/supabase';

interface AppContextType {
    state: AppState;
    currentUser: User | null;
    users: User[];
    activeProjectId: string | null;
    draggedTaskId: string | null;
    setDraggedTaskId: (id: string | null) => void;
    setActiveProjectId: (id: string | null) => void;
    addProject: (title: string, subtitle: string) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    moveProject: (draggedId: string, targetId: string) => void;
    deleteProject: (id: string) => void;
    updateCurrentUser: (updates: Partial<User>) => void;
    logout: () => void;
    toggleTaskStatus: (taskId: string) => void;
    addTask: (parentId: string | null, title: string) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    archiveTask: (taskId: string) => void;
    archiveProject: (projectId: string) => void;
    moveTask: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    addActivity: (taskId: string, content: string, type: ActivityLog['type']) => void;
    updateActivity: (taskId: string, logId: string, newContent: string) => void;
    deleteActivity: (taskId: string, logId: string) => void;
    addAttachment: (taskId: string, type: Attachment['type'], name: string, url: string) => void;
    deleteAttachment: (taskId: string, attachmentId: string) => void;
    toggleExpand: (taskId: string) => void;
    openTaskDetail: (task: Task) => void;
    activeTask: Task | null;
    setActiveTask: (task: Task | null) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    requestInput: (title: string, callback: (val: string) => void) => void;
    modalConfig: { title: string, callback: (val: string) => void } | null;
    setModalConfig: (config: { title: string, callback: (val: string) => void } | null) => void;
    openAIModal: () => void;
    showAI: boolean;
    setShowAI: (show: boolean) => void;
    openStatsModal: () => void;
    showStats: boolean;
    setShowStats: (show: boolean) => void;
    openProfileModal: () => void;
    showProfile: boolean;
    setShowProfile: (show: boolean) => void;
    setCurrentUser: (user: User | null) => void;
    notifications: any[];
    markNotificationRead: (id: string) => void;
    markAllNotificationsAsRead: () => void;
    unreadCount: number;
    isSyncing: boolean;
    notificationConfig: { type: 'success' | 'error' | 'info', title: string, message: string } | null;
    setNotificationConfig: (config: { type: 'success' | 'error' | 'info', title: string, message: string } | null) => void;
    projectMembers: User[];
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial State
    const [state, setState] = useState<AppState>({ projects: [] });
    const [users, setUsers] = useState<User[]>(USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ title: string, callback: (val: string) => void } | null>(null);
    const [notificationConfig, setNotificationConfig] = useState<{ type: 'success' | 'error' | 'info', title: string, message: string } | null>(null);
    const [projectMembers, setProjectMembers] = useState<User[]>([]);

    // UI State
    const [showAI, setShowAI] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    // --- Data Fetching ---
    const fetchUserData = useCallback(async () => {
        if (!currentUser) return;

        console.log("AppContext: fetchUserData started for", currentUser.id);
        try {
            // 1. Owned Projects
            const { data: ownedProjects, error: ownedError } = await supabase
                .from('projects')
                .select('*')
                .eq('owner_id', currentUser.id)
                .order('position', { ascending: true, nullsFirst: false });

            if (ownedError) throw ownedError;

            // 2. Shared Projects
            const { data: sharedIds } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('user_id', currentUser.id);

            let sharedProjects: any[] = [];
            if (sharedIds && sharedIds.length > 0) {
                const ids = sharedIds.map((item: any) => item.project_id);
                const { data: sharedData } = await supabase
                    .from('projects')
                    .select('*')
                    .in('id', ids)
                    .order('position', { ascending: true });
                if (sharedData) sharedProjects = sharedData;
            }

            // Merge
            let allProjectsRaw = [...(ownedProjects || []), ...sharedProjects];
            allProjectsRaw = Array.from(new Map(allProjectsRaw.map(p => [p.id, p])).values());
            allProjectsRaw.sort((a, b) => (a.position || 0) - (b.position || 0));

            // 3. Tasks
            const projectIds = allProjectsRaw.map(p => p.id);
            let tasksData: any[] = [];
            if (projectIds.length > 0) {
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('position', { ascending: true });
                if (tasks) tasksData = tasks;
            }

            // 4. Process Hierarchy
            const processedProjects: Project[] = allProjectsRaw.map((p: any) => {
                const rawTasks = tasksData.filter((t: any) => t.project_id === p.id);
                const taskMap = new Map();
                const rootTasks: Task[] = [];

                rawTasks.forEach((t: any) => {
                    taskMap.set(t.id, {
                        ...t,
                        aiContext: t.ai_context,
                        aiMediaContext: t.ai_media_context,
                        suggestedSteps: t.suggested_steps,
                        createdBy: t.created_by || p.owner_id,
                        createdAt: new Date(t.created_at).getTime(),
                        subtasks: [],
                        attachments: t.attachments || [],
                        activity: t.activity || [],
                        tags: t.tags || [],
                        expanded: t.expanded ?? true
                    });
                });

                rawTasks.forEach((t: any) => {
                    const task = taskMap.get(t.id);
                    if (t.parent_id && taskMap.has(t.parent_id)) {
                        taskMap.get(t.parent_id).subtasks.push(task);
                    } else {
                        rootTasks.push(task);
                    }
                });

                return {
                    id: p.id,
                    title: p.title,
                    subtitle: p.subtitle,
                    color: p.color,
                    createdBy: p.owner_id,
                    createdAt: new Date(p.created_at).getTime(),
                    imageUrl: p.image_url,
                    position: p.position,
                    is_archived: p.is_archived,
                    tasks: rootTasks
                };
            });

            setState({ projects: processedProjects });

            // 5. User Profiles & Fail-safe
            const { data: allUsers } = await (supabase as any).from('profiles').select('*');
            if (allUsers) {
                const mappedUsers = allUsers.map((u: any) => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    email: u.email,
                    avatarUrl: u.avatar_url,
                    avatarColor: `bg-${getRandomColor()}-500`
                }));
                setUsers(mappedUsers);

                const myProfile = mappedUsers.find((u: any) => u.id === currentUser.id);
                if (myProfile) {
                    setCurrentUser(prev => prev ? { ...prev, name: myProfile.name, avatarUrl: myProfile.avatarUrl } : prev);
                } else {
                    console.log("AppContext: Performing fail-safe sync...");
                    await (supabase as any).from('profiles').upsert({
                        id: currentUser.id, email: currentUser.email,
                        full_name: currentUser.name, avatar_url: currentUser.avatarUrl,
                        updated_at: new Date().toISOString()
                    });
                }
            }

            // Invitations
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('invite') && !processedProjects.some(p => p.id === urlParams.get('invite'))) {
                await joinProject(urlParams.get('invite')!);
            }

        } catch (error: any) {
            console.error("Critical Fetch Error:", error);
        }
    }, [currentUser?.id]);

    const fetchProjectMembers = useCallback(async () => {
        if (!activeProjectId) {
            setProjectMembers([]);
            return;
        }
        try {
            const { data: membersRaw } = await supabase.from('project_members').select('user_id').eq('project_id', activeProjectId);
            if (membersRaw) {
                const memberIds = membersRaw.map(m => m.user_id);
                const project = state.projects.find(p => p.id === activeProjectId);
                const relevantUsers = users.filter(u => memberIds.includes(u.id) || (project && u.id === project.createdBy));
                setProjectMembers(relevantUsers);
            }
        } catch (e) {
            console.error("Error fetching project members:", e);
        }
    }, [activeProjectId, users, state.projects]);

    useEffect(() => {
        fetchProjectMembers();
    }, [activeProjectId, fetchProjectMembers]);

    // --- Realtime ---
    useEffect(() => {
        let isMounted = true;
        if (!currentUser?.id) return;

        // Init Data
        const init = async () => {
            const { data } = await supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
            if (data && isMounted) setNotifications(data);

            // CRITICAL: Fetch projects and tasks on load
            fetchUserData();
        };
        init();

        // Subscriptions
        const notifChannel = supabase.channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
                payload => isMounted && setNotifications(prev => [payload.new, ...prev]))
            .subscribe();

        const collabChannel = supabase.channel('collaboration')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                console.log("Realtime: Syncing tasks...");
                fetchUserData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                console.log("Realtime: Syncing projects...");
                fetchUserData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, () => {
                console.log("Realtime: Syncing members...");
                fetchUserData();
            })
            .subscribe((status) => {
                console.log("Realtime (collab):", status);
            });

        const poll = setInterval(() => {
            fetchUserData();
        }, 60000);

        return () => {
            isMounted = false;
            supabase.removeChannel(notifChannel);
            supabase.removeChannel(collabChannel);
            clearInterval(poll);
        };
    }, [currentUser?.id, fetchUserData]);

    const joinProject = async (projectId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: currentUser.id, role: 'editor' });
            if (!error) {
                setNotificationConfig({ type: 'success', title: '¡Bienvenido!', message: 'Te has unido al proyecto exitosamente.' });
                fetchUserData();
            }
        } catch (e: any) {
            setNotificationConfig({ type: 'error', title: 'Error de Invitación', message: e.message || "Verifica el enlace." });
        } finally {
            const url = new URL(window.location.href);
            url.searchParams.delete('invite');
            window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        }
    };

    const markNotificationRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await (supabase as any).from('notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllNotificationsAsRead = async () => {
        if (notifications.length === 0) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await (supabase as any).from('notifications').update({ is_read: true }).eq('is_read', false).eq('user_id', currentUser?.id);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // --- Helpers ---
    const requestInput = useCallback((title: string, callback: (val: string) => void) => setModalConfig({ title, callback }), []);
    const modifyActiveProject = useCallback((updater: (p: Project) => Project) => {
        if (!activeProjectId) return;
        setState(prev => ({ projects: prev.projects.map(p => p.id === activeProjectId ? updater(p) : p) }));
    }, [activeProjectId]);

    // --- CRUD ---
    const addProject = useCallback(async (title: string, subtitle: string) => {
        if (!currentUser) return;
        setIsSyncing(true);
        const tempId = generateId();
        const color = getRandomColor();
        const position = Date.now() / 1000;
        const newProject: Project = { id: tempId, title, subtitle, createdAt: Date.now(), createdBy: currentUser.id, tasks: [], color, position };
        setState(prev => ({ projects: [newProject, ...prev.projects] }));
        try {
            const { data } = await supabase.from('projects').insert({ owner_id: currentUser.id, title, subtitle, color, position }).select().single();
            if (data) setState(prev => ({ projects: prev.projects.map(p => p.id === tempId ? { ...p, id: data.id } : p) }));
        } finally { setIsSyncing(false); }
    }, [currentUser]);

    const deleteProject = useCallback(async (id: string) => {
        setIsSyncing(true);
        const original = state.projects;
        setState(prev => ({ projects: prev.projects.filter(p => p.id !== id) }));
        if (activeProjectId === id) setActiveProjectId(null);
        try {
            await supabase.from('projects').delete().eq('id', id);
        } catch (e) {
            setState({ projects: original });
        } finally { setIsSyncing(false); }
    }, [activeProjectId, state.projects]);

    const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
        setState(prev => ({ projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p) }));
        const db: any = {};
        if (updates.title) db.title = updates.title;
        if (updates.subtitle) db.subtitle = updates.subtitle;
        if (updates.color) db.color = updates.color;
        if (updates.imageUrl) db.image_url = updates.imageUrl;
        if (updates.position !== undefined) db.position = updates.position;
        if (Object.keys(db).length > 0) await supabase.from('projects').update(db).eq('id', id);
    }, []);

    const moveProject = useCallback(async (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        const current = [...state.projects];
        const draggedIndex = current.findIndex(p => p.id === draggedId);
        const targetIndex = current.findIndex(p => p.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;
        const [draggedProject] = current.splice(draggedIndex, 1);
        current.splice(targetIndex, 0, draggedProject);

        let newPos = 0;
        const prev = current[targetIndex - 1];
        const next = current[targetIndex + 1];
        if (!prev) newPos = (next?.position || 0) - 1000;
        else if (!next) newPos = (prev.position || 0) + 1000;
        else newPos = ((prev.position || 0) + (next.position || 0)) / 2;

        draggedProject.position = newPos;
        setState({ projects: current });
        await supabase.from('projects').update({ position: newPos }).eq('id', draggedId);
    }, [state.projects]);

    const addTask = useCallback(async (parentId: string | null, title: string) => {
        if (!currentUser || !activeProjectId) return;
        const project = state.projects.find(p => p.id === activeProjectId);
        const currentTasks = project?.tasks || [];
        const maxPos = currentTasks.reduce((max, t) => Math.max(max, t.position || 0), 0);
        const tempId = generateId();
        const newTask: Task = { id: tempId, title, status: TaskStatus.PENDING, attachments: [], tags: [], subtasks: [], expanded: true, createdBy: currentUser.id, activity: [], position: maxPos + 1000 };

        // Optimistic UI Update
        modifyActiveProject(p => (!parentId ? { ...p, tasks: [...p.tasks, newTask] } : { ...p, tasks: findTaskAndAddSubtask(p.tasks, parentId, newTask) }));

        try {
            const { error } = await supabase.from('tasks').insert({
                project_id: activeProjectId, parent_id: parentId, title, status: 'pending', created_by: currentUser.id, position: maxPos + 1000
            });

            if (error) {
                console.error("Supabase addTask Error:", error);
                throw error;
            }

            // Sync with server state
            fetchUserData();
        } catch (e: any) {
            // Revert or Notify
            setNotificationConfig({
                type: 'error',
                title: 'Error al Guardar Tarea',
                message: e.message || 'No tienes permiso o hubo un fallo de conexión.'
            });
            // Optional: Revert optimistic change if critical
            fetchUserData();
        }
    }, [currentUser, activeProjectId, modifyActiveProject, state.projects, fetchUserData]);

    const deleteTask = useCallback(async (taskId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndDelete(p.tasks, taskId) }));
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
        } catch (e: any) {
            setNotificationConfig({
                type: 'error',
                title: 'Error al Borrar',
                message: e.message || 'No se pudo eliminar la tarea.'
            });
            fetchUserData();
        }
    }, [modifyActiveProject, fetchUserData]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, ...updates })) }));

        // Fix: Sync activeTask state if it's the one being updated
        setActiveTask(prev => {
            if (prev && prev.id === taskId) {
                return { ...prev, ...updates };
            }
            return prev;
        });

        const db: any = {};
        if (updates.title) db.title = updates.title;
        if (updates.description !== undefined) db.description = updates.description;
        if (updates.status) db.status = updates.status === TaskStatus.COMPLETED ? 'completed' : 'pending';
        if (updates.expanded !== undefined) db.expanded = updates.expanded;
        if (updates.aiContext !== undefined) db.ai_context = updates.aiContext;
        if (updates.aiMediaContext !== undefined) db.ai_media_context = updates.aiMediaContext;
        if (updates.suggestedSteps !== undefined) db.suggested_steps = updates.suggestedSteps;

        try {
            if (Object.keys(db).length > 0) {
                const { error } = await supabase.from('tasks').update(db).eq('id', taskId);
                if (error) throw error;
            }
        } catch (e: any) {
            setNotificationConfig({
                type: 'error',
                title: 'Error al Actualizar',
                message: e.message || 'No se pudo guardar el cambio.'
            });
            fetchUserData();
        }
    }, [modifyActiveProject, fetchUserData]);

    const archiveTask = useCallback(async (taskId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, is_archived: !t.is_archived })) }));
        const { data } = await supabase.from('tasks').select('is_archived').eq('id', taskId).single();
        if (data) await supabase.from('tasks').update({ is_archived: !data.is_archived }).eq('id', taskId);
    }, [modifyActiveProject]);

    const archiveProject = useCallback(async (projectId: string) => {
        setState(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === projectId ? { ...p, is_archived: !p.is_archived } : p)
        }));
        const { data } = await supabase.from('projects').select('is_archived').eq('id', projectId).single();
        if (data) {
            await supabase.from('projects').update({ is_archived: !data.is_archived }).eq('id', projectId);
            if (activeProjectId === projectId) setActiveProjectId(null);
        }
    }, [activeProjectId]);

    const toggleTaskStatus = useCallback(async (taskId: string) => {
        if (!activeProjectId) return;
        const project = state.projects.find(p => p.id === activeProjectId);
        if (!project) return;

        const task = findTask(project.tasks, taskId);
        if (!task) return;

        const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
        const updates: { id: string, status: TaskStatus }[] = [];

        // 1. Cascade Downwards: Mark all subtasks with the same status
        const collectDown = (t: Task) => {
            updates.push({ id: t.id, status: newStatus });
            t.subtasks.forEach(collectDown);
        };
        collectDown(task);

        // 2. Cascade Upwards: Check if parents should be completed/uncompleted
        let currentId = taskId;
        let tempTasks = [...project.tasks]; // Shallow copy for upward check simulation

        // We need a loop to go up the tree
        while (true) {
            const result = findTaskAndParent(tempTasks, currentId);
            if (!result || !result.parentId) break;

            const parentTask = findTask(tempTasks, result.parentId);
            if (!parentTask) break;

            // Determine parent's new status based on all its children
            // Map current updates onto the children list to see the "future" state
            const childStatuses = parentTask.subtasks.map(child => {
                const updated = updates.find(u => u.id === child.id);
                return updated ? updated.status : child.status;
            });

            const allCompleted = childStatuses.every(s => s === TaskStatus.COMPLETED);
            const parentNewStatus = allCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING;

            if (parentTask.status !== parentNewStatus) {
                updates.push({ id: parentTask.id, status: parentNewStatus });
                currentId = parentTask.id;
            } else {
                break;
            }
        }

        // Apply all updates
        try {
            // Optimistic local update
            let updatedTasks = project.tasks;
            updates.forEach(u => {
                updatedTasks = findTaskAndUpdate(updatedTasks, u.id, t => ({ ...t, status: u.status }));
            });
            modifyActiveProject(p => ({ ...p, tasks: updatedTasks }));

            // Persistent DB update
            // We do individual updates for simplicity, or we could chunk them
            for (const u of updates) {
                await supabase.from('tasks').update({ status: u.status }).eq('id', u.id);
            }
        } catch (e: any) {
            setNotificationConfig({ type: 'error', title: 'Error de Sincronización', message: e.message });
            fetchUserData();
        }
    }, [activeProjectId, state.projects, modifyActiveProject, fetchUserData]);

    const moveTask = useCallback(async (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
        if (!activeProjectId) return;
        const project = state.projects.find(p => p.id === activeProjectId);
        if (!project) return;

        // Find parent and siblings of target
        let newParentId: string | null = null;
        let siblings: Task[] = [];

        if (position === 'inside') {
            newParentId = targetId;
            const targetTask = findTask(project.tasks, targetId);
            siblings = targetTask?.subtasks || [];
        } else {
            const result = findTaskAndParent(project.tasks, targetId);
            newParentId = result?.parentId || null;
            siblings = result?.siblings || project.tasks;
        }

        // Calculate new position
        let newPos = 1000;
        const targetIndex = siblings.findIndex(t => t.id === targetId);

        if (position === 'inside') {
            const maxPos = siblings.reduce((max, t) => Math.max(max, t.position || 0), 0);
            newPos = maxPos + 1000;
        } else if (position === 'before') {
            const currentPos = siblings[targetIndex]?.position || 0;
            const prev = siblings[targetIndex - 1];
            newPos = prev ? (prev.position! + currentPos) / 2 : currentPos - 1000;
        } else if (position === 'after') {
            const currentPos = siblings[targetIndex]?.position || 0;
            const next = siblings[targetIndex + 1];
            newPos = next ? (currentPos + next.position!) / 2 : currentPos + 1000;
        }

        try {
            const { error } = await supabase.from('tasks').update({
                parent_id: newParentId,
                position: newPos
            }).eq('id', draggedId);

            if (error) throw error;
            fetchUserData();
        } catch (e: any) {
            setNotificationConfig({ type: 'error', title: 'Error al mover', message: e.message });
            fetchUserData();
        }
    }, [activeProjectId, state.projects, fetchUserData]);

    const addActivity = useCallback(async (taskId: string, content: string, type: ActivityLog['type']) => {
        if (!currentUser || !activeProjectId) return;
        const newLog: ActivityLog = { id: generateId(), type, content, timestamp: Date.now(), createdBy: currentUser.id };
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, activity: [...t.activity, newLog] })) }));
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) await supabase.from('tasks').update({ activity: [...(data.activity || []), newLog] }).eq('id', taskId);
    }, [currentUser, activeProjectId, modifyActiveProject]);

    const updateActivity = useCallback(async (taskId: string, logId: string, newContent: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, activity: t.activity.map(a => a.id === logId ? { ...a, content: newContent } : a) })) }));
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const up = (data.activity || []).map((a: any) => a.id === logId ? { ...a, content: newContent } : a);
            await supabase.from('tasks').update({ activity: up }).eq('id', taskId);
        }
    }, [modifyActiveProject]);

    const deleteActivity = useCallback(async (taskId: string, logId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, activity: t.activity.filter(a => a.id !== logId) })) }));
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const up = (data.activity || []).filter((a: any) => a.id !== logId);
            await supabase.from('tasks').update({ activity: up }).eq('id', taskId);
        }
    }, [modifyActiveProject]);

    const addAttachment = useCallback(async (taskId: string, type: Attachment['type'], name: string, url: string) => {
        if (!currentUser || !activeProjectId) return;
        const newAtt: Attachment = { id: generateId(), name, type, url, createdAt: Date.now(), createdBy: currentUser.id };
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, attachments: [...t.attachments, newAtt] })) }));
        const { data } = await supabase.from('tasks').select('attachments').eq('id', taskId).single();
        if (data) await supabase.from('tasks').update({ attachments: [...(data.attachments || []), newAtt] }).eq('id', taskId);
    }, [currentUser, activeProjectId, modifyActiveProject]);

    const deleteAttachment = useCallback(async (taskId: string, attachmentId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, attachments: t.attachments.filter(a => a.id !== attachmentId) })) }));
        const { data } = await supabase.from('tasks').select('attachments').eq('id', taskId).single();
        if (data) {
            const up = (data.attachments || []).filter((a: any) => a.id !== attachmentId);
            await supabase.from('tasks').update({ attachments: up }).eq('id', taskId);
        }
    }, [modifyActiveProject]);

    const toggleExpand = useCallback((taskId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, expanded: !t.expanded })) }));
    }, [modifyActiveProject]);

    const updateCurrentUser = useCallback(async (updates: Partial<User>) => {
        if (!currentUser) return;
        const updated = { ...currentUser, ...updates };
        setCurrentUser(updated);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
        await (supabase as any).from('profiles').upsert({
            id: currentUser.id, email: currentUser.email,
            full_name: updates.name || currentUser.name, avatar_url: updates.avatarUrl || currentUser.avatarUrl,
            updated_at: new Date().toISOString()
        });
    }, [currentUser]);

    const logout = () => { setCurrentUser(null); setActiveProjectId(null); };
    const openTaskDetail = (task: Task) => setActiveTask(task);
    const openAIModal = () => setShowAI(true);
    const openStatsModal = () => setShowStats(true);
    const openProfileModal = () => setShowProfile(true);

    return (
        <AppContext.Provider value={{
            state, currentUser, users, activeProjectId, setActiveProjectId,
            draggedTaskId, setDraggedTaskId, addProject, updateProject, moveProject, deleteProject,
            updateCurrentUser, logout, toggleTaskStatus, addTask, updateTask, deleteTask, archiveTask, archiveProject, moveTask,
            addActivity, updateActivity, deleteActivity, addAttachment, deleteAttachment, toggleExpand,
            openTaskDetail, activeTask, setActiveTask, searchQuery, setSearchQuery, requestInput,
            modalConfig, setModalConfig, openAIModal, showAI, setShowAI, openStatsModal, showStats, setShowStats,
            openProfileModal, showProfile, setShowProfile, setCurrentUser,
            notifications, markNotificationRead, markAllNotificationsAsRead, unreadCount, isSyncing,
            notificationConfig, setNotificationConfig, projectMembers
        }}>
            {children}
        </AppContext.Provider>
    );
};
