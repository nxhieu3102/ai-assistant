const HOST = import.meta.env.VITE_HOST;
const PORT = import.meta.env.VITE_PORT;

// Import Pomodoro storage functions
// Note: We can't use ES modules in background script, so we'll implement the types here
// and call the storage functions through messaging

// Pomodoro timer types and constants
type TimerMode = 'focus' | 'shortBreak' | 'longBreak'
type TimerState = 'idle' | 'running' | 'paused'

interface PomodoroTimerState {
  state: TimerState
  mode: TimerMode
  timeRemaining: number
  startTime?: number
  pausedTime?: number
  sessionsToday: number
}

interface PomodoroSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  notificationsEnabled: boolean
  soundEnabled: boolean
}

interface PomodoroSession {
  mode: TimerMode
  duration: number
  completedAt: string
  date: string
}

interface PomodoroStats {
  date: string
  focusSessionsCompleted: number
  focusMinutesCompleted: number
  breakSessionsCompleted: number
  totalSessionsCompleted: number
  longestStreak: number
}

const DEFAULT_TIMER_DURATIONS = {
  focus: 25 * 60,        // 25 minutes
  shortBreak: 5 * 60,    // 5 minutes  
  longBreak: 15 * 60     // 15 minutes
} as const

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notificationsEnabled: true,
  soundEnabled: true
}

const ALARM_NAME = 'pomodoro-timer'
const STORAGE_KEY = 'pomodoro-state'
const SETTINGS_KEY = 'pomodoro-settings'
const SESSIONS_KEY_PREFIX = 'pomodoro-sessions:'
const STATS_KEY_PREFIX = 'pomodoro-stats:'

// Global timer state and settings
let timerState: PomodoroTimerState = {
  state: 'idle',
  mode: 'focus',
  timeRemaining: DEFAULT_TIMER_DURATIONS.focus,
  sessionsToday: 0
}

let currentSettings: PomodoroSettings = DEFAULT_POMODORO_SETTINGS

async function translate(content: string) {
  try {
    const params = {
      action: 'translate',
      text: content,
      language: 'Vietnamese',
      needExplanation: 'false',
      context: 'no specific context',
    }

    const response = await fetch(
      `${HOST}:${PORT}/translate?` + new URLSearchParams(params).toString(),
    )
    return response.json()
  } catch (error) {
    console.error('Error calling API:', error)
  }
}

async function smooth(content: string) {
  try {
    const params = {
      text: content,
      context: 'no specific context',
    }

    const response = await fetch(
      `${HOST}:${PORT}/smooth?` + new URLSearchParams(params).toString(),
    )
    return response.json()
  } catch (error) {
    console.error('Error calling API:', error)
  }
}

async function save(content: string, translation: string) {
  try {
    const params = {
      initialText: content,
      translation: translation,
    }

    const response = await fetch(
      `${HOST}:${PORT}/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
    )
    return response.json()
  } catch (error) {
    console.error('Error calling API:', error)
  }
}

// Helper function to get current mode duration based on settings
function getCurrentModeDuration(mode: TimerMode): number {
  switch (mode) {
    case 'focus': return currentSettings.focusDuration
    case 'shortBreak': return currentSettings.shortBreakDuration
    case 'longBreak': return currentSettings.longBreakDuration
    default: return currentSettings.focusDuration
  }
}

// Load settings from storage
async function loadSettings(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(SETTINGS_KEY)
    if (result[SETTINGS_KEY]) {
      currentSettings = { ...DEFAULT_POMODORO_SETTINGS, ...result[SETTINGS_KEY] }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

// Save settings to storage
async function saveSettings(settings: PomodoroSettings): Promise<void> {
  try {
    currentSettings = settings
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings })
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// Helper function to get date key in format: YYYY-MM-DD
function getDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Save a completed session
async function saveCompletedSession(mode: TimerMode, duration: number): Promise<void> {
  try {
    const now = new Date()
    const dateKey = getDateKey(now)
    const sessionsKey = `${SESSIONS_KEY_PREFIX}${dateKey}`
    
    const session: PomodoroSession = {
      mode,
      duration,
      completedAt: now.toISOString(),
      date: dateKey
    }
    
    // Get existing sessions for today
    const result = await chrome.storage.local.get([sessionsKey])
    const existingSessions: PomodoroSession[] = result[sessionsKey] || []
    const updatedSessions = [...existingSessions, session]
    
    // Save updated sessions
    await chrome.storage.local.set({ [sessionsKey]: updatedSessions })
    
    // Update daily stats
    await updateDailyStats(dateKey, updatedSessions)
    
    console.log(`Saved ${mode} session (${Math.floor(duration / 60)} minutes) for ${dateKey}`)
  } catch (error) {
    console.error('Error saving completed session:', error)
  }
}

// Calculate and save daily stats
async function updateDailyStats(date: string, sessions: PomodoroSession[]): Promise<void> {
  try {
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
    await chrome.storage.local.set({ [statsKey]: stats })
  } catch (error) {
    console.error('Error updating daily stats:', error)
  }
}

// Helper function to calculate longest streak in sessions
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

// Pomodoro timer functions
async function loadTimerState(): Promise<void> {
  try {
    // Load settings first
    await loadSettings()
    
    const result = await chrome.storage.local.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      timerState = result[STORAGE_KEY]
      // Resume timer if it was running
      if (timerState.state === 'running' && timerState.startTime) {
        const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000)
        timerState.timeRemaining = Math.max(0, timerState.timeRemaining - elapsed)
        
        if (timerState.timeRemaining <= 0) {
          await handleTimerComplete()
        } else {
          await createAlarm(timerState.timeRemaining)
        }
      }
    } else {
      // Initialize with settings-based duration
      timerState.timeRemaining = getCurrentModeDuration(timerState.mode)
    }
  } catch (error) {
    console.error('Error loading timer state:', error)
  }
}

async function saveTimerState(): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: timerState })
  } catch (error) {
    console.error('Error saving timer state:', error)
  }
}

async function createAlarm(delayInSeconds: number): Promise<void> {
  try {
    await chrome.alarms.clear(ALARM_NAME)
    await chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayInSeconds / 60 })
  } catch (error) {
    console.error('Error creating alarm:', error)
  }
}

async function startTimer(): Promise<void> {
  timerState.state = 'running'
  timerState.startTime = Date.now()
  delete timerState.pausedTime
  
  await createAlarm(timerState.timeRemaining)
  await saveTimerState()
  await broadcastTimerState()
}

async function pauseTimer(): Promise<void> {
  timerState.state = 'paused'
  timerState.pausedTime = Date.now()
  
  // Calculate remaining time
  if (timerState.startTime) {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000)
    timerState.timeRemaining = Math.max(0, timerState.timeRemaining - elapsed)
  }
  
  await chrome.alarms.clear(ALARM_NAME)
  await saveTimerState()
  await broadcastTimerState()
}

async function resetTimer(): Promise<void> {
  timerState.state = 'idle'
  timerState.timeRemaining = getCurrentModeDuration(timerState.mode)
  delete timerState.startTime
  delete timerState.pausedTime
  
  await chrome.alarms.clear(ALARM_NAME)
  await saveTimerState()
  await broadcastTimerState()
}

async function skipSession(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAME)
  await handleTimerComplete()
}

async function handleTimerComplete(): Promise<void> {
  const completedMode = timerState.mode
  const completedDuration = getCurrentModeDuration(completedMode)
  
  // Save completed session data
  await saveCompletedSession(completedMode, completedDuration)
  
  // Update session tracking
  timerState.sessionsToday += 1
  
  // Simple mode alternation: focus -> shortBreak -> focus -> shortBreak...
  let nextMode: TimerMode
  if (timerState.mode === 'focus') {
    nextMode = 'shortBreak'
  } else {
    nextMode = 'focus'
  }
  
  // Transition to next mode
  timerState.mode = nextMode
  timerState.timeRemaining = getCurrentModeDuration(nextMode)
  timerState.state = 'idle'
  delete timerState.startTime
  delete timerState.pausedTime
  
  await saveTimerState()
  
  // Show notification and play sound based on settings
  if (currentSettings.notificationsEnabled) {
    await showCompletionNotification(completedMode)
  }
  if (currentSettings.soundEnabled) {
    await playCompletionSound(completedMode)
  }
  
  // Auto-start next session based on settings
  if ((nextMode !== 'focus' && currentSettings.autoStartBreaks) || 
      (nextMode === 'focus' && currentSettings.autoStartPomodoros)) {
    // Small delay before auto-starting
    setTimeout(() => {
      startTimer()
    }, 1000)
  }
  
  await broadcastTimerState()
}

async function showCompletionNotification(completedMode: TimerMode): Promise<void> {
  try {
    const modeText = getModeDisplayText(completedMode)
    const nextMode = getModeDisplayText(timerState.mode)
    
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/logo.png',
      title: '🍅 Pomodoro Timer',
      message: `${modeText} completed! Time for ${nextMode}.`,
      priority: 2
    })
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}

async function playCompletionSound(completedMode: TimerMode): Promise<void> {
  try {
    // Play the alarm sound for all completions
    // You can add different sounds later by adding more files to public/audio/
    const audio = new Audio('audio/alarm.mp3')
    audio.volume = 0.7
    
    // Play the sound
    await audio.play()
    console.log(`${completedMode} completion sound played successfully`)
  } catch (error) {
    console.error('Error playing completion sound:', error)
    // Sound will gracefully fall back to browser notification sound
  }
}

function getModeDisplayText(mode: TimerMode): string {
  switch (mode) {
    case 'focus': return 'Focus session'
    case 'shortBreak': return 'short break'
    case 'longBreak': return 'long break'
  }
}

async function broadcastTimerState(): Promise<void> {
  try {
    // Send to all tabs with the extension
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'timer-state-update',
          state: timerState
        }).catch(() => {
          // Ignore errors for tabs without content script
        })
      }
    }
    
    // Also send to runtime for popup
    chrome.runtime.sendMessage({
      action: 'timer-state-update', 
      state: timerState
    }).catch(() => {
      // Ignore if no listeners
    })
  } catch (error) {
    console.error('Error broadcasting timer state:', error)
  }
}

async function getTimerState(): Promise<PomodoroTimerState> {
  // Calculate current time remaining if timer is running
  if (timerState.state === 'running' && timerState.startTime) {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000)
    const remaining = Math.max(0, timerState.timeRemaining - elapsed)
    
    return {
      ...timerState,
      timeRemaining: remaining
    }
  }
  
  return timerState
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Starting up the extension");
  await loadTimerState();
})

// Load timer state on startup
chrome.runtime.onStartup.addListener(async () => {
  await loadTimerState();
})

// Handle alarms (timer completion)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await handleTimerComplete();
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translate(request.content)
      .then((result) => {
        sendResponse(result)
      })
      .catch((error) => {
        sendResponse({ status: 'API call failed', error: error.message })
      })
    return true
  }
  if (request.action === 'smooth') {
    smooth(request.content)
      .then((result) => {
        sendResponse(result)
      })
      .catch((error) => {
        sendResponse({ status: 'API call failed', error: error.message })
      })
    return true
  }
  if (request.action === 'save') {
    try {
      save(request.content, request.translation)
      sendResponse({ status: 'saved' })
    } catch (error) {
      sendResponse({ status: 'failed', error: 's' })
    }
    return true
  }
  
  // Pomodoro timer actions
  if (request.action === 'pomodoro-start') {
    startTimer().then(() => {
      sendResponse({ success: true, state: timerState })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
  
  if (request.action === 'pomodoro-pause') {
    pauseTimer().then(() => {
      sendResponse({ success: true, state: timerState })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
  
  if (request.action === 'pomodoro-reset') {
    resetTimer().then(() => {
      sendResponse({ success: true, state: timerState })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
  
  if (request.action === 'pomodoro-skip') {
    skipSession().then(() => {
      sendResponse({ success: true, state: timerState })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
  
  if (request.action === 'pomodoro-get-state') {
    getTimerState().then(state => {
      sendResponse({ success: true, state })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
  
  if (request.action === 'pomodoro-update-settings') {
    saveSettings(request.settings).then(() => {
      // If timer is idle and mode duration changed, update the time remaining
      if (timerState.state === 'idle') {
        timerState.timeRemaining = getCurrentModeDuration(timerState.mode)
        saveTimerState().then(() => {
          broadcastTimerState()
        })
      }
      sendResponse({ success: true })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    await chrome.storage.local.clear()
  } catch (error) {
    console.error('Error removing storage key:', error)
  }
})
