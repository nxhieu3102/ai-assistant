/**
 * Background Timer Service
 * Handles communication between the popup/UI and the background script timer
 */

export interface BackgroundTimerState {
  state: 'idle' | 'running' | 'paused'
  mode: 'focus' | 'shortBreak' | 'longBreak'
  timeRemaining: number
  startTime?: number
  pausedTime?: number
  sessionsToday: number
}

export interface BackgroundTimerResponse {
  success: boolean
  state?: BackgroundTimerState
  error?: string
}

/**
 * Send a message to the background script
 */
async function sendBackgroundMessage(action: string, data?: any): Promise<BackgroundTimerResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ 
          success: false, 
          error: chrome.runtime.lastError.message 
        })
      } else {
        resolve(response || { success: false, error: 'No response' })
      }
    })
  })
}

/**
 * Background Timer API
 */
export const backgroundTimer = {
  /**
   * Start the timer in the background
   */
  async start(): Promise<BackgroundTimerResponse> {
    return sendBackgroundMessage('pomodoro-start')
  },

  /**
   * Pause the timer in the background
   */
  async pause(): Promise<BackgroundTimerResponse> {
    return sendBackgroundMessage('pomodoro-pause')
  },

  /**
   * Reset the timer in the background
   */
  async reset(): Promise<BackgroundTimerResponse> {
    return sendBackgroundMessage('pomodoro-reset')
  },

  /**
   * Skip the current session
   */
  async skip(): Promise<BackgroundTimerResponse> {
    return sendBackgroundMessage('pomodoro-skip')
  },

  /**
   * Get the current timer state from background
   */
  async getState(): Promise<BackgroundTimerResponse> {
    return sendBackgroundMessage('pomodoro-get-state')
  },

  /**
   * Listen for timer state updates from background
   */
  addStateListener(callback: (state: BackgroundTimerState) => void): () => void {
    const listener = (message: any) => {
      if (message.action === 'timer-state-update' && message.state) {
        callback(message.state)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    
    // Return cleanup function
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  },

  /**
   * Sync local state with background state
   */
  async syncState(): Promise<BackgroundTimerState | null> {
    const response = await this.getState()
    if (response.success && response.state) {
      return response.state
    }
    return null
  }
}
