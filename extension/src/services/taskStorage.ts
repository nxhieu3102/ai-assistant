import { Task } from '../components/Tasks/TaskItem'

/**
 * Generate a date key for task storage in format: tasks:YYYY-MM-DD
 */
export const getDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `tasks:${year}-${month}-${day}`
}

/**
 * Get the previous day's date key
 */
export const getPreviousDateKey = (date: Date = new Date()): string => {
  const previousDay = new Date(date)
  previousDay.setDate(previousDay.getDate() - 1)
  return getDateKey(previousDay)
}

/**
 * Load tasks for a specific date
 */
export const loadTasksForDate = async (dateKey: string): Promise<Task[]> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([dateKey], (result) => {
      const tasks = result[dateKey] || []
      resolve(tasks)
    })
  })
}

/**
 * Save tasks for a specific date
 */
export const saveTasksForDate = async (dateKey: string, tasks: Task[]): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [dateKey]: tasks }, () => {
      resolve()
    })
  })
}

/**
 * Delete tasks for a specific date
 */
export const deleteTasksForDate = async (dateKey: string): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove([dateKey], () => {
      resolve()
    })
  })
}

/**
 * Migrate uncompleted tasks from previous day to today
 */
export const migratePreviousDayTasks = async (): Promise<Task[]> => {
  const todayKey = getDateKey()
  const yesterdayKey = getPreviousDateKey()
  
  // Load today's tasks and yesterday's tasks
  const [todayTasks, yesterdayTasks] = await Promise.all([
    loadTasksForDate(todayKey),
    loadTasksForDate(yesterdayKey)
  ])
  
  // If no yesterday tasks, return today's tasks as-is
  if (yesterdayTasks.length === 0) {
    return todayTasks
  }
  
  // Find uncompleted tasks from yesterday
  const uncompletedYesterdayTasks = yesterdayTasks
    .filter(task => !task.completed)
    .map(task => ({
      ...task,
      // Update the created date to today but keep original ID for continuity
      createdAt: new Date().toISOString()
    }))
  
  // Combine with today's existing tasks (put migrated tasks at the end)
  const combinedTasks = [...todayTasks, ...uncompletedYesterdayTasks]
  
  // Save the combined tasks to today
  await saveTasksForDate(todayKey, combinedTasks)
  
  // Clean up yesterday's tasks (optional: you might want to keep them for history)
  // For now, we'll keep completed tasks from yesterday for reference
  const completedYesterdayTasks = yesterdayTasks.filter(task => task.completed)
  if (completedYesterdayTasks.length > 0) {
    await saveTasksForDate(yesterdayKey, completedYesterdayTasks)
  } else {
    // No completed tasks, remove the day entirely
    await deleteTasksForDate(yesterdayKey)
  }
  
  return combinedTasks
}

/**
 * Load today's tasks with automatic migration from previous day
 */
export const loadTodaysTasks = async (): Promise<Task[]> => {
  const todayKey = getDateKey()
  
  // Check if we've already migrated today by looking for a migration flag
  const migrationKey = `migrated:${todayKey}`
  
  return new Promise(async (resolve) => {
    chrome.storage.local.get([migrationKey], async (result) => {
      if (result[migrationKey]) {
        // Already migrated today, just load today's tasks
        const tasks = await loadTasksForDate(todayKey)
        resolve(tasks)
      } else {
        // First time loading today, perform migration
        const migratedTasks = await migratePreviousDayTasks()
        
        // Mark that we've migrated for today
        chrome.storage.local.set({ [migrationKey]: true })
        
        resolve(migratedTasks)
      }
    })
  })
}

/**
 * Save today's tasks
 */
export const saveTodaysTasks = async (tasks: Task[]): Promise<void> => {
  const todayKey = getDateKey()
  await saveTasksForDate(todayKey, tasks)
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
 * Clean up old task data (older than specified days)
 */
export const cleanupOldTasks = async (daysToKeep: number = 30): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (allData) => {
      const keysToDelete: string[] = []
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      Object.keys(allData).forEach(key => {
        if (key.startsWith('tasks:') || key.startsWith('migrated:')) {
          const dateStr = key.split(':')[1]
          if (dateStr) {
            const taskDate = new Date(dateStr)
            if (taskDate < cutoffDate) {
              keysToDelete.push(key)
            }
          }
        }
      })
      
      if (keysToDelete.length > 0) {
        chrome.storage.local.remove(keysToDelete, () => {
          console.log(`Cleaned up ${keysToDelete.length} old task entries`)
          resolve()
        })
      } else {
        resolve()
      }
    })
  })
}
