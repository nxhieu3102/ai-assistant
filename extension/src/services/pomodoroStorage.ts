/**
 * Pomodoro Storage Service
 * Handles persistence for Pomodoro timer settings, state, and statistics
 * Following the same patterns as taskStorage.ts
 */

export interface PomodoroSettings {
  focusDuration: number       // in seconds
  shortBreakDuration: number  // in seconds
  longBreakDuration: number   // in seconds
  longBreakInterval: number   // number of focus sessions before long break
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  notificationsEnabled: boolean
  soundEnabled: boolean
}

export interface PomodoroSession {
  mode: 'focus' | 'shortBreak' | 'longBreak'
  duration: number
  completedAt: string
  date: string // YYYY-MM-DD format
}

export interface PomodoroTimerState {
  state: 'idle' | 'running' | 'paused'
  mode: 'focus' | 'shortBreak' | 'longBreak'
  timeRemaining: number
  startTime?: number
  pausedTime?: number
  sessionsToday: number
  lastSessionDate?: string
}

export interface PomodoroStats {
  date: string
  focusSessionsCompleted: number
  focusMinutesCompleted: number
  breakSessionsCompleted: number
  totalSessionsCompleted: number
  longestStreak: number
}

// Default settings
export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25 * 60,      // 25 minutes
  shortBreakDuration: 5 * 60,   // 5 minutes  
  longBreakDuration: 15 * 60,   // 15 minutes
  longBreakInterval: 4,         // Every 4 focus sessions
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notificationsEnabled: true,
  soundEnabled: true
}

// Storage keys
const SETTINGS_KEY = 'pomodoro-settings'
const TIMER_STATE_KEY = 'pomodoro-state'
const SESSIONS_KEY_PREFIX = 'pomodoro-sessions:'
const STATS_KEY_PREFIX = 'pomodoro-stats:'

/**
 * Generate a date key in format: YYYY-MM-DD
 */
export const getDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Load Pomodoro settings from storage
 */
export const loadPomodoroSettings = async (): Promise<PomodoroSettings> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([SETTINGS_KEY], (result) => {
      const settings = result[SETTINGS_KEY] || DEFAULT_POMODORO_SETTINGS
      // Ensure all required keys exist (for migration/updates)
      resolve({ ...DEFAULT_POMODORO_SETTINGS, ...settings })
    })
  })
}

/**
 * Save Pomodoro settings to storage
 */
export const savePomodoroSettings = async (settings: PomodoroSettings): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Load timer state from storage
 */
export const loadTimerState = async (): Promise<PomodoroTimerState | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([TIMER_STATE_KEY], (result) => {
      const state = result[TIMER_STATE_KEY] || null
      resolve(state)
    })
  })
}

/**
 * Save timer state to storage
 */
export const saveTimerState = async (state: PomodoroTimerState): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [TIMER_STATE_KEY]: state }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Clear timer state from storage
 */
export const clearTimerState = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove([TIMER_STATE_KEY], () => {
      resolve()
    })
  })
}

/**
 * Save a completed session
 */
export const saveSession = async (session: PomodoroSession): Promise<void> => {
  const dateKey = `${SESSIONS_KEY_PREFIX}${session.date}`
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([dateKey], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      
      const existingSessions: PomodoroSession[] = result[dateKey] || []
      const updatedSessions = [...existingSessions, session]
      
      chrome.storage.local.set({ [dateKey]: updatedSessions }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  })
}

/**
 * Load sessions for a specific date
 */
export const loadSessionsForDate = async (date: string): Promise<PomodoroSession[]> => {
  const dateKey = `${SESSIONS_KEY_PREFIX}${date}`
  
  return new Promise((resolve) => {
    chrome.storage.local.get([dateKey], (result) => {
      const sessions = result[dateKey] || []
      resolve(sessions)
    })
  })
}

/**
 * Load sessions for today
 */
export const loadTodaysSessions = async (): Promise<PomodoroSession[]> => {
  const today = getDateKey()
  return loadSessionsForDate(today)
}

/**
 * Calculate and save daily stats
 */
export const updateDailyStats = async (date: string): Promise<PomodoroStats> => {
  const sessions = await loadSessionsForDate(date)
  
  const stats: PomodoroStats = {
    date,
    focusSessionsCompleted: sessions.filter(s => s.mode === 'focus').length,
    focusMinutesCompleted: sessions
      .filter(s => s.mode === 'focus')
      .reduce((total, s) => total + Math.floor(s.duration / 60), 0),
    breakSessionsCompleted: sessions.filter(s => s.mode !== 'focus').length,
    totalSessionsCompleted: sessions.length,
    longestStreak: calculateLongestStreak(sessions)
  }
  
  const statsKey = `${STATS_KEY_PREFIX}${date}`
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [statsKey]: stats }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(stats)
      }
    })
  })
}

/**
 * Load stats for a specific date
 */
export const loadStatsForDate = async (date: string): Promise<PomodoroStats | null> => {
  const statsKey = `${STATS_KEY_PREFIX}${date}`
  
  return new Promise((resolve) => {
    chrome.storage.local.get([statsKey], (result) => {
      const stats = result[statsKey] || null
      resolve(stats)
    })
  })
}

/**
 * Load stats for multiple dates
 */
export const loadStatsForDateRange = async (startDate: string, endDate: string): Promise<PomodoroStats[]> => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dates: string[] = []
  
  // Generate all dates in range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(getDateKey(d))
  }
  
  // Load stats for all dates
  const statsPromises = dates.map(date => loadStatsForDate(date))
  const allStats = await Promise.all(statsPromises)
  
  // Filter out null results and return
  return allStats.filter(stats => stats !== null) as PomodoroStats[]
}

/**
 * Load stats for the last 7 days
 */
export const loadWeeklyStats = async (): Promise<PomodoroStats[]> => {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 6) // Last 7 days including today
  
  return loadStatsForDateRange(getDateKey(startDate), getDateKey(endDate))
}

/**
 * Export all Pomodoro data as JSON
 */
export const exportPomodoroData = async (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, async (allLocalData) => {
      chrome.storage.sync.get(null, (allSyncData) => {
        const pomodoroData: {
          settings: PomodoroSettings
          sessions: Record<string, any>
          stats: Record<string, any>
          exportDate: string
        } = {
          settings: allSyncData[SETTINGS_KEY] || DEFAULT_POMODORO_SETTINGS,
          sessions: {},
          stats: {},
          exportDate: new Date().toISOString()
        }
        
        // Filter Pomodoro-related data
        Object.keys(allLocalData).forEach(key => {
          if (key.startsWith(SESSIONS_KEY_PREFIX)) {
            const date = key.replace(SESSIONS_KEY_PREFIX, '')
            pomodoroData.sessions[date] = allLocalData[key]
          } else if (key.startsWith(STATS_KEY_PREFIX)) {
            const date = key.replace(STATS_KEY_PREFIX, '')
            pomodoroData.stats[date] = allLocalData[key]
          }
        })
        
        resolve(JSON.stringify(pomodoroData, null, 2))
      })
    })
  })
}

/**
 * Reset all Pomodoro data
 */
export const resetPomodoroData = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (allData) => {
      const keysToDelete: string[] = []
      
      Object.keys(allData).forEach(key => {
        if (key.startsWith(SESSIONS_KEY_PREFIX) || 
            key.startsWith(STATS_KEY_PREFIX) || 
            key === TIMER_STATE_KEY) {
          keysToDelete.push(key)
        }
      })
      
      if (keysToDelete.length > 0) {
        chrome.storage.local.remove(keysToDelete, () => {
          // Also reset settings to defaults
          chrome.storage.sync.set({ [SETTINGS_KEY]: DEFAULT_POMODORO_SETTINGS }, () => {
            resolve()
          })
        })
      } else {
        // Just reset settings
        chrome.storage.sync.set({ [SETTINGS_KEY]: DEFAULT_POMODORO_SETTINGS }, () => {
          resolve()
        })
      }
    })
  })
}

/**
 * Clean up old Pomodoro data (older than specified days)
 */
export const cleanupOldPomodoroData = async (daysToKeep: number = 90): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (allData) => {
      const keysToDelete: string[] = []
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      Object.keys(allData).forEach(key => {
        if (key.startsWith(SESSIONS_KEY_PREFIX) || key.startsWith(STATS_KEY_PREFIX)) {
          const dateStr = key.split(':')[1]
          if (dateStr) {
            const dataDate = new Date(dateStr)
            if (dataDate < cutoffDate) {
              keysToDelete.push(key)
            }
          }
        }
      })
      
      if (keysToDelete.length > 0) {
        chrome.storage.local.remove(keysToDelete, () => {
          console.log(`Cleaned up ${keysToDelete.length} old Pomodoro entries`)
          resolve()
        })
      } else {
        resolve()
      }
    })
  })
}

/**
 * Helper function to calculate longest streak in sessions
 */
function calculateLongestStreak(sessions: PomodoroSession[]): number {
  if (sessions.length === 0) return 0
  
  const focusSessions = sessions
    .filter(s => s.mode === 'focus')
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
  
  if (focusSessions.length === 0) return 0
  
  let maxStreak = 1
  let currentStreak = 1
  
  for (let i = 1; i < focusSessions.length; i++) {
    const prevTime = new Date(focusSessions[i - 1].completedAt)
    const currentTime = new Date(focusSessions[i].completedAt)
    const timeDiff = currentTime.getTime() - prevTime.getTime()
    
    // Consider sessions part of a streak if they're within 60 minutes of each other
    if (timeDiff <= 60 * 60 * 1000) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }
  
  return maxStreak
}
