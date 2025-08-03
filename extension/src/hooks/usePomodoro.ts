import { useState, useEffect, useCallback, useRef } from 'react'
import { backgroundTimer, BackgroundTimerState } from '../services/backgroundTimer'
import { PomodoroSettings, loadPomodoroSettings, DEFAULT_POMODORO_SETTINGS } from '../services/pomodoroStorage'

// Timer configuration - will be overridden by user settings
export const TIMER_DURATIONS = {
  focus: 25 * 60,        // 25 minutes
  shortBreak: 5 * 60,    // 5 minutes  
  longBreak: 15 * 60     // 15 minutes
} as const

// Timer types
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'
export type TimerState = 'idle' | 'running' | 'paused'

export interface PomodoroSession {
  mode: TimerMode
  duration: number
  completedAt: string
}

export interface UsePomodoroOptions {
  onSessionComplete?: (session: PomodoroSession) => void
  onModeChange?: (mode: TimerMode) => void
  onStateChange?: (state: TimerState) => void
  autoStartBreaks?: boolean
  enableKeyboardShortcuts?: boolean
}

export interface UsePomodoroReturn {
  // Timer state
  timerState: TimerState
  currentMode: TimerMode
  timeRemaining: number
  currentCycle: number
  completedCycles: number
  sessionsToday: number
  
  // Computed values
  progress: number
  isRunning: boolean
  isPaused: boolean
  isIdle: boolean
  
  // Control functions
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  
  // Utility functions
  formatTime: (seconds: number) => string
  getTimeDisplay: () => string
  getModeLabel: (mode?: TimerMode) => string
  
  // Cycle information
  getCycleInfo: () => {
    current: number
    total: number
    isLongBreakNext: boolean
  }
}

/**
 * Custom hook for managing Pomodoro timer functionality
 * Integrates with background script for persistent timer state
 */
export const usePomodoro = (options: UsePomodoroOptions = {}): UsePomodoroReturn => {
  const {
    onSessionComplete,
    onModeChange,
    onStateChange,
    autoStartBreaks = false,
    enableKeyboardShortcuts = true
  } = options

  // Core timer state (synced with background)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [currentMode, setCurrentMode] = useState<TimerMode>('focus')
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATIONS.focus)
  const [currentCycle, setCurrentCycle] = useState(1)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS)

  // Refs for cleanup and callbacks
  const prevStateRef = useRef<TimerState>(timerState)
  const prevModeRef = useRef<TimerMode>(currentMode)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupListenerRef = useRef<(() => void) | null>(null)

  // Format time display (MM:SS)
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Get current time display
  const getTimeDisplay = useCallback((): string => {
    return formatTime(timeRemaining)
  }, [timeRemaining, formatTime])

  // Get mode label for display
  const getModeLabel = useCallback((mode: TimerMode = currentMode): string => {
    switch (mode) {
      case 'focus': return 'Focus Time'
      case 'shortBreak': return 'Short Break'
      case 'longBreak': return 'Long Break'
    }
  }, [currentMode])

  // Update state from background timer
  const updateFromBackgroundState = useCallback((bgState: BackgroundTimerState) => {
    const prevMode = currentMode
    const prevState = timerState
    
    setTimerState(bgState.state)
    setCurrentMode(bgState.mode)
    setTimeRemaining(bgState.timeRemaining)
    setCurrentCycle(bgState.currentCycle)
    setCompletedCycles(bgState.completedCycles)
    setSessionsToday(bgState.sessionsToday)

    // Trigger callbacks for mode/state changes
    if (prevMode !== bgState.mode) {
      onModeChange?.(bgState.mode)
    }
    if (prevState !== bgState.state) {
      onStateChange?.(bgState.state)
    }

    // Check for session completion (when mode changes and sessions increase)
    if (prevMode !== bgState.mode && bgState.sessionsToday > sessionsToday) {
      const session: PomodoroSession = {
        mode: prevMode,
        duration: TIMER_DURATIONS[prevMode],
        completedAt: new Date().toISOString()
      }
      onSessionComplete?.(session)
    }
  }, [currentMode, timerState, sessionsToday, onModeChange, onStateChange, onSessionComplete])

  // Load settings on mount
  useEffect(() => {
    loadPomodoroSettings().then(setSettings).catch(console.error)
  }, [])

  // Initialize and sync with background on mount
  useEffect(() => {
    let mounted = true

    const initializeTimer = async () => {
      try {
        const bgState = await backgroundTimer.syncState()
        if (mounted && bgState) {
          updateFromBackgroundState(bgState)
        }
      } catch (error) {
        console.error('Failed to sync with background timer:', error)
      }
    }

    initializeTimer()

    // Set up listener for background state updates
    cleanupListenerRef.current = backgroundTimer.addStateListener((bgState) => {
      if (mounted) {
        updateFromBackgroundState(bgState)
      }
    })

    return () => {
      mounted = false
      if (cleanupListenerRef.current) {
        cleanupListenerRef.current()
        cleanupListenerRef.current = null
      }
    }
  }, [updateFromBackgroundState])

  // Regular state updates for running timer (UI responsiveness)
  useEffect(() => {
    if (timerState === 'running') {
      updateIntervalRef.current = setInterval(async () => {
        try {
          const bgState = await backgroundTimer.syncState()
          if (bgState) {
            updateFromBackgroundState(bgState)
          }
        } catch (error) {
          console.error('Failed to sync timer state:', error)
        }
      }, 1000)
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [timerState, updateFromBackgroundState])

  // Get current mode duration based on settings
  const getCurrentModeDuration = useCallback((mode: TimerMode): number => {
    switch (mode) {
      case 'focus': return settings.focusDuration
      case 'shortBreak': return settings.shortBreakDuration
      case 'longBreak': return settings.longBreakDuration
      default: return settings.focusDuration
    }
  }, [settings])

  // Calculate progress percentage
  const currentModeDuration = getCurrentModeDuration(currentMode)
  const progress = currentModeDuration > 0 
    ? (currentModeDuration - timeRemaining) / currentModeDuration * 100 
    : 0

  // Computed state flags
  const isRunning = timerState === 'running'
  const isPaused = timerState === 'paused'
  const isIdle = timerState === 'idle'

  // Get cycle information
  const getCycleInfo = useCallback(() => {
    const cyclePosition = completedCycles % 4
    return {
      current: cyclePosition + 1,
      total: 4,
      isLongBreakNext: cyclePosition === 3
    }
  }, [completedCycles])

  // Control functions - delegate to background timer
  const start = useCallback(async () => {
    try {
      await backgroundTimer.start()
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }, [])

  const pause = useCallback(async () => {
    try {
      await backgroundTimer.pause()
    } catch (error) {
      console.error('Failed to pause timer:', error)
    }
  }, [])

  const reset = useCallback(async () => {
    try {
      await backgroundTimer.reset()
    } catch (error) {
      console.error('Failed to reset timer:', error)
    }
  }, [])

  const skip = useCallback(async () => {
    try {
      await backgroundTimer.skip()
    } catch (error) {
      console.error('Failed to skip session:', error)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (event.target && (event.target as Element).tagName === 'INPUT') return

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (timerState === 'running') {
            pause()
          } else {
            start()
          }
          break
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            reset()
          }
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            skip()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [timerState, start, pause, reset, skip, enableKeyboardShortcuts])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      if (cleanupListenerRef.current) {
        cleanupListenerRef.current()
      }
    }
  }, [])

  return {
    // State
    timerState,
    currentMode,
    timeRemaining,
    currentCycle,
    completedCycles,
    sessionsToday,
    
    // Computed
    progress,
    isRunning,
    isPaused,
    isIdle,
    
    // Controls
    start,
    pause,
    reset,
    skip,
    
    // Utils
    formatTime,
    getTimeDisplay,
    getModeLabel,
    getCycleInfo
  }
}
