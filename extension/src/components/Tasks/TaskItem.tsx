import React, { useState, useEffect } from 'react'
import { Checkbox, Button, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { getTranslation, SupportedLanguage } from '../../services/i18n'

const { Text } = Typography

export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

interface TaskItemProps {
  task: Task
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
}

const TaskContainer = styled(motion.div)<{ completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => props.completed ? '#f6ffed' : '#ffffff'};
  border: 2px solid ${props => props.completed ? '#b7eb8f' : '#f0f0f0'};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.completed ? '#52c41a' : '#1890ff'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:focus-within {
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    border: 3px solid currentColor;
    background: ${props => props.completed ? 'Mark' : 'Canvas'};
    color: ${props => props.completed ? 'MarkText' : 'CanvasText'};
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const TaskText = styled(Text)<{ completed: boolean }>`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: ${props => props.completed ? '#389e0d' : '#262626'}; /* Improved contrast */
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  opacity: ${props => props.completed ? 0.8 : 1}; /* Improved contrast */
  word-break: break-word;

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    color: ${props => props.completed ? 'MarkText' : 'CanvasText'};
    opacity: 1;
  }
`

const DeleteButton = styled(Button)`
  opacity: 0;
  transition: all 0.2s ease;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  ${TaskContainer}:hover &,
  ${TaskContainer}:focus-within & {
    opacity: 1;
  }

  &:focus {
    opacity: 1;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.3);
  }

  &:focus-visible {
    outline: 2px solid #ff4d4f;
    outline-offset: 2px;
  }

  &:hover {
    background-color: #ff4d4f;
    border-color: #ff4d4f;
    color: #ffffff;
    transform: scale(1.1);
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    opacity: 1;
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

const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox {
    border-radius: 4px;
    border-width: 2px;
  }

  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #52c41a;
    border-color: #52c41a;
  }

  .ant-checkbox:hover .ant-checkbox-inner {
    border-color: #1890ff;
  }

  .ant-checkbox:focus .ant-checkbox-inner {
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.3);
  }

  .ant-checkbox-input:focus-visible + .ant-checkbox-inner {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .ant-checkbox {
      border: 3px solid currentColor;
    }
    
    .ant-checkbox:focus .ant-checkbox-inner {
      outline: 3px solid;
      outline-offset: 2px;
    }
  }
`

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
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

  return (
    <TaskContainer
      completed={task.completed}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      layout
      role="listitem"
      aria-label={`Task: ${task.text}`}
    >
      <StyledCheckbox
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={task.completed ? `Mark "${task.text}" as incomplete` : `Mark "${task.text}" as complete`}
        aria-describedby={`task-text-${task.id}`}
      />
      
      <TaskText 
        completed={task.completed}
        id={`task-text-${task.id}`}
        aria-label={task.completed ? `Completed task: ${task.text}` : `Pending task: ${task.text}`}
      >
        {task.text}
      </TaskText>
      
      <DeleteButton
        type="text"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(task.id)}
        title={t('deleteTask')}
        aria-label={`Delete task: ${task.text}`}
        size="small"
      />
    </TaskContainer>
  )
}
