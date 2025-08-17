import * as path from 'path'
import { fileURLToPath } from 'url'
import { neboa } from 'neboa'
import { Task } from '../models/translateModel'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database document types
interface TaskDocument extends Task {
  date: string // YYYY-MM-DD format for the day this task belongs to
}

interface MetadataDocument {
  key: string
  value: string
}

class TaskRepo {
  private db: any
  private tasksCollection: any
  private metadataCollection: any

  constructor() {
    // Use relative path from repository directory to database file
    const dbPath = path.join(__dirname, '../../temp/tasks.db')
    this.db = neboa(dbPath)
    
    // Initialize collections
    this.tasksCollection = this.db.collection('tasks')
    this.metadataCollection = this.db.collection('metadata')
    
    // Initialize default metadata if not exists
    this.initializeMetadata()
  }

  private initializeMetadata(): void {
    try {
      // Check if lastMigration exists, if not create it
      const lastMigrationDoc = this.metadataCollection.query()
        .equalTo('key', 'lastMigration')
        .limit(1)
        .find()

      if (lastMigrationDoc.length === 0) {
        this.metadataCollection.insert({
          key: 'lastMigration',
          value: new Date().toISOString()
        })
      }

      // Check if version exists, if not create it
      const versionDoc = this.metadataCollection.query()
        .equalTo('key', 'version')
        .limit(1)
        .find()

      if (versionDoc.length === 0) {
        this.metadataCollection.insert({
          key: 'version',
          value: '1'
        })
      }
    } catch (error) {
      console.error('Failed to initialize metadata:', error)
    }
  }

  public async getTasksForDate(date: string): Promise<Task[]> {
    try {
      const taskDocs = this.tasksCollection.query()
        .equalTo('date', date)
        .find()

      // Convert TaskDocument[] to Task[] by removing the date field and deduplicating by task.id
      const taskMap = new Map<string, Task>()
      
      taskDocs.forEach((doc: TaskDocument) => {
        const task: Task = {
          id: doc.id,
          text: doc.text,
          completed: doc.completed,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }
        // Use the most recent version if there are duplicates
        if (!taskMap.has(task.id) || new Date(task.updatedAt) > new Date(taskMap.get(task.id)!.updatedAt)) {
          taskMap.set(task.id, task)
        }
      })
      
      return Array.from(taskMap.values())
    } catch (error) {
      console.error('Failed to get tasks for date:', error)
      return []
    }
  }

  public async saveTasksForDate(date: string, tasks: Task[]): Promise<void> {
    try {
      // First, delete all existing tasks for this date using the document's internal ID
      const existingTasks = this.tasksCollection.query()
        .equalTo('date', date)
        .find()

      existingTasks.forEach((taskDoc: any) => {
        // Use the document's internal ID (_id) for deletion, not our custom task.id
        this.tasksCollection.delete(taskDoc._id)
      })

      // Insert all new tasks with the date field
      tasks.forEach((task: Task) => {
        const taskDoc: TaskDocument = {
          ...task,
          date: date
        }
        this.tasksCollection.insert(taskDoc)
      })

      // Update last migration timestamp
      await this.setLastMigration(new Date().toISOString())
    } catch (error) {
      throw new Error(`Failed to save tasks for date: ${error}`)
    }
  }

  public async getAllDays(): Promise<Record<string, Task[]>> {
    try {
      const allTasks = this.tasksCollection.query().find()
      const dayMap: Record<string, Map<string, Task>> = {}

      allTasks.forEach((taskDoc: TaskDocument) => {
        if (!dayMap[taskDoc.date]) {
          dayMap[taskDoc.date] = new Map<string, Task>()
        }
        
        // Convert TaskDocument to Task by removing the date field
        const task: Task = {
          id: taskDoc.id,
          text: taskDoc.text,
          completed: taskDoc.completed,
          createdAt: taskDoc.createdAt,
          updatedAt: taskDoc.updatedAt
        }
        
        // Deduplicate by task.id, keeping the most recent version
        const existingTask = dayMap[taskDoc.date].get(task.id)
        if (!existingTask || new Date(task.updatedAt) > new Date(existingTask.updatedAt)) {
          dayMap[taskDoc.date].set(task.id, task)
        }
      })

      // Convert Maps back to arrays
      const result: Record<string, Task[]> = {}
      Object.keys(dayMap).forEach(date => {
        result[date] = Array.from(dayMap[date].values())
      })

      return result
    } catch (error) {
      console.error('Failed to get all days:', error)
      return {}
    }
  }

  public async deleteDaysBefore(cutoffDate: string): Promise<void> {
    try {
      const allTasks = this.tasksCollection.query().find()
      
      allTasks.forEach((taskDoc: any) => {
        if (taskDoc.date < cutoffDate) {
          // Use the document's internal ID (_id) for deletion
          this.tasksCollection.delete(taskDoc._id)
        }
      })
    } catch (error) {
      throw new Error(`Failed to delete days before cutoff: ${error}`)
    }
  }

  public async getLastMigration(): Promise<string> {
    try {
      const docs = this.metadataCollection.query()
        .equalTo('key', 'lastMigration')
        .limit(1)
        .find()

      if (docs.length > 0) {
        return docs[0].value
      }
      
      // Return default if not found
      const defaultTimestamp = new Date().toISOString()
      await this.setLastMigration(defaultTimestamp)
      return defaultTimestamp
    } catch (error) {
      console.error('Failed to get last migration:', error)
      return new Date().toISOString()
    }
  }

  public async setLastMigration(timestamp: string): Promise<void> {
    try {
      // Find existing lastMigration document
      const existingDocs = this.metadataCollection.query()
        .equalTo('key', 'lastMigration')
        .find()

      if (existingDocs.length > 0) {
        // Delete existing document and create new one (simpler approach)
        this.metadataCollection.delete(existingDocs[0]._id)
        this.metadataCollection.insert({
          key: 'lastMigration',
          value: timestamp
        })
      } else {
        // Create new document
        this.metadataCollection.insert({
          key: 'lastMigration',
          value: timestamp
        })
      }
    } catch (error) {
      throw new Error(`Failed to set last migration: ${error}`)
    }
  }
}

export default TaskRepo
