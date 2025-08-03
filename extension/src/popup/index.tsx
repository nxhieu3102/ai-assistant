import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { Button, Tooltip } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Tabs } from '../components/Tabs'
import { TranslateTab } from '../components/TranslateTab'
import { Tasks } from '../components/Tasks/Tasks'
import { PomodoroTimer } from '../components/PomoPlaceholder'
import { useKeyboardNavigation, getShortcutText } from '../hooks/useKeyboardNavigation'
import { getTranslation, SupportedLanguage } from '../services/i18n'
import './index.css'

const PopupContainer = motion.div

const StyledCard = styled.div`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  position: relative;
  min-width: 400px;
  max-width: 500px;
`

const Popup = () => {
  const [activeTab, setActiveTab] = useState('translate')
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('English')

  // Load saved active tab and language on mount
  useEffect(() => {
    chrome.storage.sync.get(['activeTab', 'defaultLanguage'], (result) => {
      if (result.activeTab) {
        setActiveTab(result.activeTab)
      }
      if (result.defaultLanguage) {
        setCurrentLanguage(result.defaultLanguage as SupportedLanguage)
      }
    })
  }, [])

  // Helper function to get translations
  const t = (key: any) => getTranslation(key, currentLanguage)

  // Save active tab when it changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    chrome.storage.sync.set({ activeTab: tabId })
  }

  const tabs = [
    {
      id: 'translate',
      label: t('translateTab'),
      content: <TranslateTab />
    },
    {
      id: 'tasks',
      label: t('tasksTab'),
      content: <Tasks />
    },
    {
      id: 'pomo',
      label: t('pomoTab'),
      content: <PomodoroTimer />
    }
  ]

  // Handle keyboard navigation
  const handleKeyboardTabSwitch = (tabIndex: number) => {
    const targetTab = tabs[tabIndex]
    if (targetTab) {
      handleTabChange(targetTab.id)
    }
  }

  // Setup keyboard navigation
  useKeyboardNavigation({
    onTabSwitch: handleKeyboardTabSwitch,
    tabIds: tabs.map(tab => tab.id),
    isEnabled: true
  })

  const handleClosePopup = () => {
    window.close()
  }

  return (
    <PopupContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <StyledCard>
        <Tabs 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        {/* Close Button */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClosePopup}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        />
      </StyledCard>
    </PopupContainer>
  )
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
