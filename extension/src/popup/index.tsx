import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Tabs } from '../components/Tabs'
import { TranslateTab } from '../components/TranslateTab'
import { Tasks } from '../components/Tasks/Tasks'
import { PomoPlaceholder } from '../components/PomoPlaceholder'
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

  // Load saved active tab on mount
  useEffect(() => {
    chrome.storage.sync.get(['activeTab'], (result) => {
      if (result.activeTab) {
        setActiveTab(result.activeTab)
      }
    })
  }, [])

  // Save active tab when it changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    chrome.storage.sync.set({ activeTab: tabId })
  }

  const handleClosePopup = () => {
    window.close()
  }

  const tabs = [
    {
      id: 'translate',
      label: 'Translate',
      content: <TranslateTab />
    },
    {
      id: 'tasks',
      label: 'Tasks',
      content: <Tasks />
    },
    {
      id: 'pomo',
      label: 'Pomo',
      content: <PomoPlaceholder />
    }
  ]

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
