import { Task, TasksData, CreateTaskRequest, UpdateTaskRequest, ResponseData } from '../models/translateModel'
import TaskRepo from '../repository/TaskRepo'
import { randomBytes } from 'crypto'

class TaskService {
  private taskRepo: TaskRepo

  constructor() {
    this.taskRepo = new TaskRepo()
  }

  private generateId(): string {
    // Generate ULID-like ID using timestamp + random bytes
    const timestamp = Date.now().toString(36)
    const randomPart = randomBytes(8).toString('hex')
    return `${timestamp}${randomPart}`.toUpperCase()
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0]
  }

  private validateTaskText(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new Error('Task text is required')
    }
    
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      throw new Error('Task text cannot be empty')
    }
    
    if (trimmedText.length > 140) {
      throw new Error('Task text must be 140 characters or less')
    }
  }

  private sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // Pending tasks first, then completed
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      // Within each group, newest created first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  public async getTasksForDate(date?: string): Promise<ResponseData> {
    try {
      const targetDate = date || this.getTodayString()
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        return {
          status: 'error',
          error: 'Invalid date format. Use YYYY-MM-DD',
          content: ''
        }
      }

      const tasks = await this.taskRepo.getTasksForDate(targetDate)
      const sortedTasks = this.sortTasks(tasks)

      return {
        status: 'success',
        error: '',
        content: JSON.stringify(sortedTasks)
      }
    } catch (error) {
      console.error('Error getting tasks:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: ''
      }
    }
  }

  public async createTask(request: CreateTaskRequest, date?: string): Promise<ResponseData> {
    try {
      this.validateTaskText(request.text)
      
      const targetDate = date || this.getTodayString()
      const today = this.getTodayString()
      
      // Validate that we can't create tasks for past dates
      if (targetDate < today) {
        return {
          status: 'error',
          error: 'Cannot create tasks for past dates',
          content: ''
        }
      }
      
      const now = new Date().toISOString()
      
      const newTask: Task = {
        id: this.generateId(),
        text: request.text.trim(),
        completed: false,
        createdAt: now,
        updatedAt: now
      }

      const existingTasks = await this.taskRepo.getTasksForDate(targetDate)
      existingTasks.push(newTask)
      
      await this.taskRepo.saveTasksForDate(targetDate, existingTasks)

      return {
        status: 'success',
        error: '',
        content: JSON.stringify(newTask)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: ''
      }
    }
  }

  public async updateTask(taskId: string, request: UpdateTaskRequest, date?: string): Promise<ResponseData> {
    try {
      const targetDate = date || this.getTodayString()
      const tasks = await this.taskRepo.getTasksForDate(targetDate)
      
      const taskIndex = tasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) {
        return {
          status: 'error',
          error: 'Task not found',
          content: ''
        }
      }

      const task = tasks[taskIndex]
      
      // Validate text if provided
      if (request.text !== undefined) {
        this.validateTaskText(request.text)
        task.text = request.text.trim()
      }
      
      // Update completion status if provided
      if (request.completed !== undefined) {
        task.completed = request.completed
      }
      
      task.updatedAt = new Date().toISOString()
      tasks[taskIndex] = task
      
      await this.taskRepo.saveTasksForDate(targetDate, tasks)

      return {
        status: 'success',
        error: '',
        content: JSON.stringify(task)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: ''
      }
    }
  }

  public async deleteTask(taskId: string, date?: string): Promise<ResponseData> {
    try {
      const targetDate = date || this.getTodayString()
      const tasks = await this.taskRepo.getTasksForDate(targetDate)
      
      const taskIndex = tasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) {
        return {
          status: 'error',
          error: 'Task not found',
          content: ''
        }
      }

      const deletedTask = tasks.splice(taskIndex, 1)[0]
      await this.taskRepo.saveTasksForDate(targetDate, tasks)

      return {
        status: 'success',
        error: '',
        content: JSON.stringify(deletedTask)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: ''
      }
    }
  }

  public async migrateUnfinishedTasks(): Promise<ResponseData> {
    // Migration is disabled - tasks now stay in their original dates
    // This endpoint is kept for backward compatibility
    return {
      status: 'success',
      error: '',
      content: 'Migration disabled - tasks remain in their original dates'
    }
  }

  public async getTaskCountsByDate(): Promise<ResponseData> {
    try {
      const allDays = await this.taskRepo.getAllDays()
      const taskCounts: Record<string, { total: number; completed: number; incomplete: number }> = {}

      Object.keys(allDays).forEach(date => {
        const tasks = allDays[date]
        const completed = tasks.filter(task => task.completed).length
        const incomplete = tasks.filter(task => !task.completed).length
        
        taskCounts[date] = {
          total: tasks.length,
          completed,
          incomplete
        }
      })

      return {
        status: 'success',
        error: '',
        content: JSON.stringify(taskCounts)
      }
    } catch (error) {
      console.error('Error getting task counts by date:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: ''
      }
    }
  }

  public async getIncompleteTasks(): Promise<ResponseData> {
    try {
      const today = this.getTodayString()
      const allDays = await this.taskRepo.getAllDays()
      const incompleteTasks: Array<Task & { originalDate: string }> = []

      // Get all incomplete tasks from dates before today
      Object.keys(allDays).forEach(date => {
        if (date < today) {
          const dayTasks = allDays[date]
          const dayIncompleteTasks = dayTasks
            .filter(task => !task.completed)
            .map(task => ({
              ...task,
              originalDate: date
            }))
          incompleteTasks.push(...dayIncompleteTasks)
        }
      })

      // Sort by original date (newest first) and then by creation time
      incompleteTasks.sort((a, b) => {
        if (a.originalDate !== b.originalDate) {
          return b.originalDate.localeCompare(a.originalDate)
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      return {
        status: 'success',
        error: '',
        content: JSON.stringify(incompleteTasks)
      }
    } catch (error) {
      console.error('Error getting incomplete tasks:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: ''
      }
    }
  }
}

export default TaskService
