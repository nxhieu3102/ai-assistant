import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

const TabsContainer = styled.div`
  width: 100%;
`

const TabsList = styled.div`
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 12px 12px 0 0;
`

const TabButton = styled(motion.button)<{ isActive: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${props => props.isActive ? '#ffffff' : 'transparent'};
  color: ${props => props.isActive ? '#1890ff' : '#666666'};
  font-size: 14px;
  font-weight: ${props => props.isActive ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: ${props => props.isActive ? '8px 8px 0 0' : '0'};
  position: relative;

  &:hover {
    color: #1890ff;
    background: ${props => props.isActive ? '#ffffff' : '#f5f5f5'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  ${props => props.isActive && `
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    border-bottom: 2px solid #1890ff;
    margin-bottom: -1px;
  `}
`

const TabContent = styled(motion.div)`
  padding: 20px;
  background: #ffffff;
  border-radius: 0 0 12px 12px;
  min-height: 400px;
`

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <TabsContainer>
      <TabsList role="tablist">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={tab.id === activeTab}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls={`tabpanel-${tab.id}`}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabsList>
      
      <TabContent
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabContent}
      </TabContent>
    </TabsContainer>
  )
}
