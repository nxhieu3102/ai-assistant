import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import lockfile from 'proper-lockfile';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class TaskRepo {
    filePath;
    lockPath;
    backupDir;
    maxBackups = 10;
    constructor() {
        // Use relative path from repository directory to temp folder
        this.filePath = path.join(__dirname, '../../temp/tasks.json');
        this.lockPath = `${this.filePath}.lock`;
        this.backupDir = path.join(__dirname, '../../temp/backups');
        // Ensure temp and backup directories exist
        this.ensureDirectories();
    }
    ensureDirectories() {
        const tempDir = path.dirname(this.filePath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    createBackup() {
        if (!fs.existsSync(this.filePath))
            return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `tasks.backup.${timestamp}.json`);
        try {
            fs.copyFileSync(this.filePath, backupPath);
            this.cleanupOldBackups();
        }
        catch (error) {
            console.error('Failed to create backup:', error);
        }
    }
    cleanupOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('tasks.backup.') && file.endsWith('.json'))
                .map(file => ({
                name: file,
                path: path.join(this.backupDir, file),
                stats: fs.statSync(path.join(this.backupDir, file))
            }))
                .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
            // Keep only the latest maxBackups files
            if (files.length > this.maxBackups) {
                files.slice(this.maxBackups).forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
        }
        catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }
    getDefaultData() {
        return {
            version: 1,
            lastMigration: new Date().toISOString(),
            days: {}
        };
    }
    async read() {
        try {
            // If file doesn't exist, create it with default data (without locking)
            if (!fs.existsSync(this.filePath)) {
                const defaultData = this.getDefaultData();
                const jsonData = JSON.stringify(defaultData, null, 2);
                fs.writeFileSync(this.filePath, jsonData, 'utf-8');
                return defaultData;
            }
            const release = await lockfile.lock(this.filePath, { retries: { retries: 3, minTimeout: 100 } });
            try {
                const fileContent = fs.readFileSync(this.filePath, 'utf-8');
                const data = JSON.parse(fileContent);
                return data;
            }
            finally {
                release();
            }
        }
        catch (error) {
            throw new Error(`Failed to read tasks file: ${error}`);
        }
    }
    async write(data) {
        try {
            // Ensure the file exists before attempting to lock it
            if (!fs.existsSync(this.filePath)) {
                // Create an empty file to lock
                fs.writeFileSync(this.filePath, '{}', 'utf-8');
            }
            const release = await lockfile.lock(this.filePath, { retries: { retries: 3, minTimeout: 100 } });
            try {
                // Create backup before writing
                this.createBackup();
                // Atomic write: write to temp file, then rename
                const tempPath = `${this.filePath}.tmp`;
                const jsonData = JSON.stringify(data, null, 2);
                fs.writeFileSync(tempPath, jsonData, 'utf-8');
                fs.renameSync(tempPath, this.filePath);
            }
            finally {
                release();
            }
        }
        catch (error) {
            throw new Error(`Failed to write tasks file: ${error}`);
        }
    }
    async getTasksForDate(date) {
        const data = await this.read();
        return data.days[date] || [];
    }
    async saveTasksForDate(date, tasks) {
        const data = await this.read();
        data.days[date] = tasks;
        data.lastMigration = new Date().toISOString();
        await this.write(data);
    }
    async getAllDays() {
        const data = await this.read();
        return data.days;
    }
    async deleteDaysBefore(cutoffDate) {
        const data = await this.read();
        Object.keys(data.days).forEach(date => {
            if (date < cutoffDate) {
                delete data.days[date];
            }
        });
        await this.write(data);
    }
    async getLastMigration() {
        const data = await this.read();
        return data.lastMigration;
    }
    async setLastMigration(timestamp) {
        const data = await this.read();
        data.lastMigration = timestamp;
        await this.write(data);
    }
}
export default TaskRepo;
