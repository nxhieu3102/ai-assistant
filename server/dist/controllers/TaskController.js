import TaskService from '../services/TaskService';
class TaskController {
    taskService;
    constructor() {
        this.taskService = new TaskService();
    }
    getTasks = async (req, res) => {
        try {
            const date = req.query.date;
            const result = await this.taskService.getTasksForDate(date);
            res.json(result);
        }
        catch (error) {
            console.error('Error in getTasks:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
    createTask = async (req, res) => {
        try {
            const request = {
                text: req.body.text
            };
            const date = req.query.date;
            const result = await this.taskService.createTask(request, date);
            res.json(result);
        }
        catch (error) {
            console.error('Error in createTask:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
    updateTask = async (req, res) => {
        try {
            const taskId = req.params.id;
            const request = {
                text: req.body.text,
                completed: req.body.completed
            };
            const date = req.query.date;
            const result = await this.taskService.updateTask(taskId, request, date);
            res.json(result);
        }
        catch (error) {
            console.error('Error in updateTask:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
    deleteTask = async (req, res) => {
        try {
            const taskId = req.params.id;
            const date = req.query.date;
            const result = await this.taskService.deleteTask(taskId, date);
            res.json(result);
        }
        catch (error) {
            console.error('Error in deleteTask:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
    migrateTasks = async (req, res) => {
        try {
            const result = await this.taskService.migrateUnfinishedTasks();
            res.json(result);
        }
        catch (error) {
            console.error('Error in migrateTasks:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
    getTaskCountsByDate = async (req, res) => {
        try {
            const result = await this.taskService.getTaskCountsByDate();
            res.json(result);
        }
        catch (error) {
            console.error('Error in getTaskCountsByDate:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
    getIncompleteTasks = async (req, res) => {
        try {
            const result = await this.taskService.getIncompleteTasks();
            res.json(result);
        }
        catch (error) {
            console.error('Error in getIncompleteTasks:', error);
            res.status(500).json({
                status: 'error',
                error: 'Internal server error',
                content: ''
            });
        }
    };
}
export default TaskController;
