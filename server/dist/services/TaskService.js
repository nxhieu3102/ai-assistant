import TaskRepo from '../repository/TaskRepo';
import { randomBytes } from 'crypto';
class TaskService {
    taskRepo;
    constructor() {
        this.taskRepo = new TaskRepo();
    }
    generateId() {
        // Generate ULID-like ID using timestamp + random bytes
        const timestamp = Date.now().toString(36);
        const randomPart = randomBytes(8).toString('hex');
        return `${timestamp}${randomPart}`.toUpperCase();
    }
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }
    validateTaskText(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Task text is required');
        }
        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            throw new Error('Task text cannot be empty');
        }
        if (trimmedText.length > 140) {
            throw new Error('Task text must be 140 characters or less');
        }
    }
    sortTasks(tasks) {
        return tasks.sort((a, b) => {
            // Pending tasks first, then completed
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // Within each group, newest created first
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    async getTasksForDate(date) {
        try {
            const targetDate = date || this.getTodayString();
            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
                return {
                    status: 'error',
                    error: 'Invalid date format. Use YYYY-MM-DD',
                    content: ''
                };
            }
            const tasks = await this.taskRepo.getTasksForDate(targetDate);
            const sortedTasks = this.sortTasks(tasks);
            return {
                status: 'success',
                error: '',
                content: JSON.stringify(sortedTasks)
            };
        }
        catch (error) {
            console.error('Error getting tasks:', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                content: ''
            };
        }
    }
    async createTask(request, date) {
        try {
            this.validateTaskText(request.text);
            const targetDate = date || this.getTodayString();
            const now = new Date().toISOString();
            const newTask = {
                id: this.generateId(),
                text: request.text.trim(),
                completed: false,
                createdAt: now,
                updatedAt: now
            };
            const existingTasks = await this.taskRepo.getTasksForDate(targetDate);
            existingTasks.push(newTask);
            await this.taskRepo.saveTasksForDate(targetDate, existingTasks);
            return {
                status: 'success',
                error: '',
                content: JSON.stringify(newTask)
            };
        }
        catch (error) {
            console.error('Error creating task:', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                content: ''
            };
        }
    }
    async updateTask(taskId, request, date) {
        try {
            const targetDate = date || this.getTodayString();
            const tasks = await this.taskRepo.getTasksForDate(targetDate);
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex === -1) {
                return {
                    status: 'error',
                    error: 'Task not found',
                    content: ''
                };
            }
            const task = tasks[taskIndex];
            // Validate text if provided
            if (request.text !== undefined) {
                this.validateTaskText(request.text);
                task.text = request.text.trim();
            }
            // Update completion status if provided
            if (request.completed !== undefined) {
                task.completed = request.completed;
            }
            task.updatedAt = new Date().toISOString();
            tasks[taskIndex] = task;
            await this.taskRepo.saveTasksForDate(targetDate, tasks);
            return {
                status: 'success',
                error: '',
                content: JSON.stringify(task)
            };
        }
        catch (error) {
            console.error('Error updating task:', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                content: ''
            };
        }
    }
    async deleteTask(taskId, date) {
        try {
            const targetDate = date || this.getTodayString();
            const tasks = await this.taskRepo.getTasksForDate(targetDate);
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex === -1) {
                return {
                    status: 'error',
                    error: 'Task not found',
                    content: ''
                };
            }
            const deletedTask = tasks.splice(taskIndex, 1)[0];
            await this.taskRepo.saveTasksForDate(targetDate, tasks);
            return {
                status: 'success',
                error: '',
                content: JSON.stringify(deletedTask)
            };
        }
        catch (error) {
            console.error('Error deleting task:', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                content: ''
            };
        }
    }
    async migrateUnfinishedTasks() {
        try {
            const today = this.getTodayString();
            const lastMigration = await this.taskRepo.getLastMigration();
            const lastMigrationDate = lastMigration.split('T')[0];
            // Skip if already migrated today
            if (lastMigrationDate === today) {
                return {
                    status: 'success',
                    error: '',
                    content: 'Migration already completed today'
                };
            }
            const allDays = await this.taskRepo.getAllDays();
            const todayTasks = allDays[today] || [];
            let migratedCount = 0;
            // Get yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];
            // Migrate unfinished tasks from yesterday
            if (allDays[yesterdayString]) {
                const unfinishedTasks = allDays[yesterdayString].filter(task => !task.completed);
                // Update timestamps for migrated tasks
                unfinishedTasks.forEach(task => {
                    task.updatedAt = new Date().toISOString();
                });
                todayTasks.unshift(...unfinishedTasks);
                migratedCount = unfinishedTasks.length;
            }
            // Save updated today's tasks
            await this.taskRepo.saveTasksForDate(today, todayTasks);
            // Clean up old data (older than 30 days)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            const cutoffString = cutoffDate.toISOString().split('T')[0];
            await this.taskRepo.deleteDaysBefore(cutoffString);
            // Update migration timestamp
            await this.taskRepo.setLastMigration(new Date().toISOString());
            return {
                status: 'success',
                error: '',
                content: `Migrated ${migratedCount} unfinished tasks to today`
            };
        }
        catch (error) {
            console.error('Error during migration:', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                content: ''
            };
        }
    }
}
export default TaskService;
