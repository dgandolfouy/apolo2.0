import type { Task, Project } from '../types';
import { TaskStatus } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 10);

export function getRandomColor(): string {
    const colors = ['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet', 'fuchsia'];
    return colors[Math.floor(Math.random() * colors.length)];
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 256;
                const scaleSize = MAX_WIDTH / img.width;

                const width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
                const height = (img.width > MAX_WIDTH) ? img.height * scaleSize : img.height;

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const getTaskProgress = (task: Task): number => {
    if (task.subtasks.length === 0) {
        return task.status === TaskStatus.COMPLETED ? 100 : 0;
    }
    const totalProgress = task.subtasks.reduce((acc, sub) => acc + getTaskProgress(sub), 0);
    return Math.round(totalProgress / task.subtasks.length);
};

export const getProjectProgress = (project: Project): number => {
    if (project.tasks.length === 0) return 0;
    const total = project.tasks.reduce((acc, t) => acc + getTaskProgress(t), 0);
    return Math.round(total / project.tasks.length);
};

export const searchTasks = (tasks: Task[], query: string): Task[] => {
    return tasks.reduce((acc: Task[], task) => {
        const match = task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description?.toLowerCase().includes(query.toLowerCase());
        const childMatches = searchTasks(task.subtasks, query);
        if (match || childMatches.length > 0) {
            acc.push({ ...task, subtasks: childMatches, expanded: true });
        }
        return acc;
    }, []);
};

export const findTask = (tasks: Task[], id: string): Task | undefined => {
    for (const task of tasks) {
        if (task.id === id) return task;
        const found = findTask(task.subtasks, id);
        if (found) return found;
    }
    return undefined;
};

export const findTaskAndUpdate = (tasks: Task[], targetId: string, updater: (t: Task) => Task): Task[] => {
    return tasks.map(task => {
        if (task.id === targetId) return updater(task);
        if (task.subtasks.length > 0) return { ...task, subtasks: findTaskAndUpdate(task.subtasks, targetId, updater) };
        return task;
    });
};

export const findTaskAndAddSubtask = (tasks: Task[], parentId: string, newTask: Task): Task[] => {
    return tasks.map(task => {
        if (task.id === parentId) return { ...task, subtasks: [...task.subtasks, newTask], expanded: true };
        if (task.subtasks.length > 0) return { ...task, subtasks: findTaskAndAddSubtask(task.subtasks, parentId, newTask) };
        return task;
    });
};

export const findTaskAndDelete = (tasks: Task[], targetId: string): Task[] => {
    return tasks.filter(t => t.id !== targetId).map(task => ({
        ...task,
        subtasks: findTaskAndDelete(task.subtasks, targetId)
    }));
};
