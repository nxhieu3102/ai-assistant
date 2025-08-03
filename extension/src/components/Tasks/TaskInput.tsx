import React, { useState, KeyboardEvent, useEffect } from 'react'
import { Input, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { getTranslation, SupportedLanguage } from '../../services/i18n'

interface TaskInputProps {
  onAddTask: (taskText: string) => void
  placeholder?: string
}

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`

const StyledInput = styled(Input)`
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  transition: all 0.2s ease;

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.3);
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
  }

  &::placeholder {
    color: #8c8c8c; /* Improved contrast ratio */
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    border: 3px solid currentColor;
    
    &:focus {
      outline: 3px solid;
      outline-offset: 2px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const AddButton = styled(Button)`
  border-radius: 8px;
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.4);
  }

  &:focus-visible {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
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

export const TaskInput: React.FC<TaskInputProps> = ({ 
  onAddTask, 
  placeholder
}) => {
  const [inputValue, setInputValue] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('English')

  // Load current language from storage
  useEffect(() => {
    chrome.storage.sync.get(['defaultLanguage'], (result) => {
      if (result.defaultLanguage) {
        setCurrentLanguage(result.defaultLanguage as SupportedLanguage)
      }
    })
  }, [])

  // Helper function to get translations
  const t = (key: any) => getTranslation(key, currentLanguage)

  const handleAddTask = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue) {
      onAddTask(trimmedValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask()
    }
  }

  return (
    <InputContainer role="search" aria-label="Add new task">
      <StyledInput
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPressEnter={handleKeyPress}
        placeholder={placeholder || t('taskPlaceholder')}
        maxLength={200}
        autoFocus
        aria-label="Task description"
        aria-describedby="task-input-help"
        role="textbox"
      />
      <AddButton
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddTask}
        disabled={!inputValue.trim()}
        title={`${t('addTask')} (Enter)`}
        aria-label={`${t('addTask')} (Enter)`}
        aria-describedby="task-input-help"
      />
      <div 
        id="task-input-help" 
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        Press Enter or click the plus button to add a new task. Maximum 200 characters.
      </div>
    </InputContainer>
  )
}
