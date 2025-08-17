import React, { useState, useEffect } from 'react'
import { Typography, Button, Tag, Space, Tabs, message } from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  RedoOutlined,
  FireOutlined,
  ClockCircleOutlined,
  ForwardOutlined,
  SettingOutlined,
  ClockCircleTwoTone,
  BarChartOutlined
} from '@ant-design/icons'

import styled from 'styled-components'
import { getTranslation, SupportedLanguage } from '../services/i18n'
import { usePomodoro, TimerMode, PomodoroSession } from '../hooks/usePomodoro'
import { PomodoroSettings } from './Pomodoro/PomodoroSettings'
import { PomodoroStats } from './Pomodoro/PomodoroStats'
import { PomodoroSettings as SettingsType, loadPomodoroSettings } from '../services/pomodoroStorage'

const { Title, Text } = Typography

const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  width: 100%;
`

const TimerDisplay = styled.div<{ mode: TimerMode }>`
  background: ${props => {
    switch (props.mode) {
      case 'focus': return 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)'
      case 'shortBreak': return 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
      case 'longBreak': return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    }
  }};
  border-radius: 16px;
  width: 300px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;

  &:focus {
    outline: 3px solid #1890ff;
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    border: 2px solid currentColor;
    background: ${props => props.mode === 'focus' ? 'Canvas' : 'Mark'};
    color: ${props => props.mode === 'focus' ? 'CanvasText' : 'MarkText'};
  }
`

const TimeText = styled.div`
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
`

const ModeText = styled.div`
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
`

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin: 24px 0;
  width: 100%;
`

const ControlButton = styled(Button)<{ variant?: 'primary' | 'secondary' }>`
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: none;
  
  ${props => props.variant === 'primary' ? `
    background: #ff6b6b;
    color: white;
    
    &:hover {
      background: #ff5252;
      transform: scale(1.05);
    }
  ` : `
    background: #f0f0f0;
    color: #666;
    
    &:hover {
      background: #e0e0e0;
      transform: scale(1.05);
    }
  `}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.4);
  }

  &:focus-visible {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    border: 2px solid currentColor;
    
    &:focus {
      outline: 3px solid;
      outline-offset: 2px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition: none;
  }
`

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-top: 20px;
`



export const PomodoroTimer: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('English')
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [pomodoroSettings, setPomodoroSettings] = useState<SettingsType | null>(null)
  const [activeTab, setActiveTab] = useState('timer')

  // Load current language from storage
  useEffect(() => {
    chrome.storage.sync.get(['defaultLanguage'], (result) => {
      if (result.defaultLanguage) {
        setCurrentLanguage(result.defaultLanguage as SupportedLanguage)
      }
    })
  }, [])

  // Load Pomodoro settings
  useEffect(() => {
    loadPomodoroSettings().then(setPomodoroSettings).catch(console.error)
  }, [])

  // Helper function to get translations
  const t = (key: any) => getTranslation(key, currentLanguage)

  // Session completion handler
  const handleSessionComplete = (session: PomodoroSession) => {
    // For now, just log the session. This will be expanded in future tasks
    console.log('Session completed:', session)
  }

  // Mode change handler for announcements
  const handleModeChange = (mode: TimerMode) => {
    // Announce mode change for screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = `Switched to ${getModeText(mode)}`
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement)
      }
    }, 1000)
  }

  // Initialize Pomodoro hook
  const {
    timerState,
    currentMode,
    timeRemaining,
    sessionsToday,
    progress,
    isRunning,
    isPaused,
    isIdle,
    start,
    pause,
    reset,
    skip,
    getTimeDisplay
  } = usePomodoro({
    onSessionComplete: handleSessionComplete,
    onModeChange: handleModeChange,
    enableKeyboardShortcuts: true
  })

  // Get current mode display text
  const getModeText = (mode: TimerMode): string => {
    switch (mode) {
      case 'focus': return t('focusTime')
      case 'shortBreak': return t('breakTime')
      case 'longBreak': return t('breakTime')
    }
  }



  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  // Handle export success
  const handleExportSuccess = () => {
    message.success(t('dataExported'))
  }

  // Handle reset success  
  const handleResetSuccess = () => {
    message.success(t('dataReset'))
  }

  // Timer tab content
  const renderTimerTab = () => (
    <div role="main" aria-labelledby="timer-heading">
      {/* Timer Display */}
      <TimerDisplay 
        mode={currentMode}
        tabIndex={0}
        role="timer"
        aria-live="polite"
        aria-label={`${getModeText(currentMode)} timer: ${getTimeDisplay()} remaining`}
      >
        <TimeText aria-hidden="true">
          {getTimeDisplay()}
        </TimeText>
        <ModeText aria-hidden="true">
          {getModeText(currentMode)}
        </ModeText>
      </TimerDisplay>



      {/* Control Buttons */}
      <ControlsContainer role="group" aria-label="Timer controls">
        {(isIdle || isPaused) ? (
          <ControlButton
            variant="primary"
            onClick={start}
            aria-label={isIdle ? 'Start timer (Space)' : 'Resume timer (Space)'}
            title={isIdle ? 'Start timer (Space)' : 'Resume timer (Space)'}
          >
            <PlayCircleOutlined />
          </ControlButton>
        ) : (
          <ControlButton
            variant="primary"
            onClick={pause}
            aria-label="Pause timer (Space)"
            title="Pause timer (Space)"
          >
            <PauseCircleOutlined />
          </ControlButton>
        )}
        
        <ControlButton
          variant="secondary"
          onClick={reset}
          aria-label="Reset timer (Ctrl+R)"
          title="Reset timer (Ctrl+R)"
          disabled={isIdle && progress === 0}
        >
          <RedoOutlined />
        </ControlButton>

        <ControlButton
          variant="secondary"
          onClick={skip}
          aria-label="Skip to next session (Ctrl+S)"
          title="Skip to next session (Ctrl+S)"
          disabled={isIdle && progress === 0}
        >
          <ForwardOutlined />
        </ControlButton>
      </ControlsContainer>

      {/* Session Information */}
      <SessionInfo role="region" aria-labelledby="session-info">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space style={{ justifyContent: 'center', width: '100%' }}>
            <Tag 
              color={currentMode === 'focus' ? 'volcano' : 'green'} 
              icon={currentMode === 'focus' ? <FireOutlined /> : <ClockCircleOutlined />}
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {getModeText(currentMode)}
            </Tag>
          </Space>
          
          <Text style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
            Focus Sessions • Completed Today: {sessionsToday}
          </Text>

          {/* Settings Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              aria-label={t('openSettings')}
              title={t('openSettings')}
              style={{ fontSize: '16px' }}
            >
              {t('settings')}
            </Button>
          </div>
        </Space>
      </SessionInfo>
    </div>
  )

  // Tab items configuration
  const tabItems = [
    {
      key: 'timer',
      label: (
        <Space>
          <ClockCircleTwoTone twoToneColor="#ff6b6b" />
          <span>{t('timer')}</span>
        </Space>
      ),
      children: renderTimerTab()
    },
    {
      key: 'stats',
      label: (
        <Space>
          <BarChartOutlined style={{ color: '#1890ff' }} />
          <span>{t('statistics')}</span>
        </Space>
      ),
      children: (
        <PomodoroStats 
          onExport={handleExportSuccess}
          onReset={handleResetSuccess}
        />
      )
    }
  ]

  return (
    <TimerContainer>
      <Title 
        level={4} 
        style={{ color: '#ff6b6b', marginBottom: '16px', textAlign: 'center' }}
      >
        🍅 {t('pomodoroTimer')}
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        centered
        size="small"
        style={{ width: '100%' }}
        tabBarStyle={{
          marginBottom: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}
      />

      {/* Settings Modal */}
      {pomodoroSettings && (
        <PomodoroSettings
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          onSettingsChange={(newSettings) => {
            setPomodoroSettings(newSettings)
            // Trigger a settings update in the background script
            chrome.runtime.sendMessage({ 
              action: 'pomodoro-update-settings', 
              settings: newSettings 
            }).catch(() => {
              // Ignore errors for now
            })
          }}
        />
      )}
    </TimerContainer>
  )
}
