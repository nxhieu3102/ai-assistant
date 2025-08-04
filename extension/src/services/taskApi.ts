import { Task } from '../components/Tasks/TaskItem'

// Server API configuration
const HOST = import.meta.env.VITE_HOST;
const PORT = import.meta.env.VITE_PORT;
const SERVER_BASE_URL = `${HOST}:${PORT}`;


// Response type from server
interface ApiResponse<T = any> {
  status: 'success' | 'error'
  error: string
  content: string | T
}

/**
 * Parse server response content
 */
const parseResponse = <T>(response: ApiResponse): T => {
  if (response.status === 'error') {
    throw new Error(response.error)
  }
  
  if (typeof response.content === 'string') {
    try {
      return JSON.parse(response.content) as T
    } catch (error) {
      throw new Error('Invalid JSON response from server')
    }
  }
  
  return response.content as T
}

/**
 * Generate a date string in YYYY-MM-DD format
 */
export const getDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get tasks for a specific date
 */
export const getTasksForDate = async (date?: string): Promise<Task[]> => {
  const targetDate = date || getDateString()
  
  try {
    const response = await fetch(`${SERVER_BASE_URL}/tasks?date=${targetDate}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const apiResponse: ApiResponse = await response.json()
    return parseResponse<Task[]>(apiResponse)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw new Error(`Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a new task
 */
export const createTask = async (text: string, date?: string): Promise<Task> => {
  const targetDate = date || getDateString()
  
  try {
    const response = await fetch(`${SERVER_BASE_URL}/tasks?date=${targetDate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const apiResponse: ApiResponse = await response.json()
    return parseResponse<Task>(apiResponse)
  } catch (error) {
    console.error('Error creating task:', error)
    throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update a task (text and/or completion status)
 */
export const updateTask = async (
  taskId: string, 
  updates: { text?: string; completed?: boolean }, 
  date?: string
): Promise<Task> => {
  const targetDate = date || getDateString()
  
  try {
    const response = await fetch(`${SERVER_BASE_URL}/tasks/${taskId}?date=${targetDate}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const apiResponse: ApiResponse = await response.json()
    return parseResponse<Task>(apiResponse)
  } catch (error) {
    console.error('Error updating task:', error)
    throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string, date?: string): Promise<Task> => {
  const targetDate = date || getDateString()
  
  try {
    const response = await fetch(`${SERVER_BASE_URL}/tasks/${taskId}?date=${targetDate}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const apiResponse: ApiResponse = await response.json()
    return parseResponse<Task>(apiResponse)
  } catch (error) {
    console.error('Error deleting task:', error)
    throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Load today's tasks (with automatic migration on server side)
 */
export const loadTodaysTasks = async (): Promise<Task[]> => {
  return getTasksForDate() // Server handles migration automatically
}

/**
 * Trigger manual migration (for debugging/admin purposes)
 */
export const triggerMigration = async (): Promise<string> => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/tasks/migrate`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const apiResponse: ApiResponse = await response.json()
    return parseResponse<string>(apiResponse)
  } catch (error) {
    console.error('Error triggering migration:', error)
    throw new Error(`Failed to trigger migration: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get task statistics for today
 */
export const getTaskStats = (tasks: Task[]) => {
  const completed = tasks.filter(task => task.completed).length
  const pending = tasks.filter(task => !task.completed).length
  const total = tasks.length
  
  return { completed, pending, total }
}

/**
 * Check if server is reachable
 */
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking server health:', SERVER_BASE_URL)
    const response = await fetch(`${SERVER_BASE_URL}/tasks`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    return response.ok
  } catch (error) {
    console.error('Server health check failed:', error)
    return false
  }
}
