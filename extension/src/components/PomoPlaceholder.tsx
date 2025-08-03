import React, { useState, useEffect } from 'react'
import { Typography, Button, Progress, Tag, Space, Divider, Tabs, message } from 'antd'
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
import { motion } from 'framer-motion'
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
  border-radius: 50%;
  width: 180px;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 4px solid rgba(255, 255, 255, 0.3);
  color: white;
  position: relative;

  &:focus {
    outline: 3px solid #1890ff;
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    border: 4px solid currentColor;
    background: ${props => props.mode === 'focus' ? 'Canvas' : 'Mark'};
    color: ${props => props.mode === 'focus' ? 'CanvasText' : 'MarkText'};
  }
`

const TimeText = styled.div`
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 4px;
`

const ModeText = styled.div`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
`

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 24px 0;
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

const CycleIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
`

const CycleDot = styled.div<{ active: boolean; completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => 
    props.completed ? '#52c41a' : 
    props.active ? '#ff6b6b' : '#d9d9d9'
  };
  transition: all 0.2s ease;
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
    currentCycle,
    completedCycles,
    sessionsToday,
    progress,
    isRunning,
    isPaused,
    isIdle,
    start,
    pause,
    reset,
    skip,
    getTimeDisplay,
    getCycleInfo
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

  // Render cycle indicator dots
  const renderCycleIndicator = () => {
    const dots = []
    const cycleInfo = getCycleInfo()
    
    // Calculate position in the current 4-session Pomodoro cycle
    const cyclePosition = completedCycles % 4
    
    for (let i = 0; i < 4; i++) {
      const sessionNumber = i + 1
      // A session is completed if we've completed more than this session number in current cycle
      const isCompleted = i < cyclePosition
      // A session is active if we're currently on this session and in focus mode
      const isActive = i === cyclePosition && currentMode === 'focus'
      
      dots.push(
        <CycleDot 
          key={i}
          active={isActive}
          completed={isCompleted}
          aria-label={`Focus session ${sessionNumber}: ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}
        />
      )
    }
    return dots
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
      {/* Cycle Indicator */}
      <CycleIndicator role="group" aria-label="Pomodoro cycle progress">
        {renderCycleIndicator()}
      </CycleIndicator>

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

      {/* Progress Ring */}
      <Progress 
        type="circle" 
        percent={progress} 
        width={200}
        strokeColor={currentMode === 'focus' ? '#ff6b6b' : currentMode === 'shortBreak' ? '#4caf50' : '#2196f3'}
        trailColor="#f0f0f0"
        showInfo={false}
        style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

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
            Pomodoro Cycle {Math.floor(completedCycles / 4) + 1} • Focus Sessions: {completedCycles % 4}/4 • Completed Today: {completedCycles}
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
