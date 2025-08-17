import React, { useState, useEffect } from 'react'
import { Typography, Collapse, Empty, Divider, Badge, message } from 'antd'
import { CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import { TaskItem } from './TaskItem'
import { 
  IncompleteTask, 
  getIncompleteTasks, 
  updateIncompleteTask, 
  deleteIncompleteTask 
} from '../../services/taskApi'
import { getTranslation, SupportedLanguage } from '../../services/i18n'

const { Text } = Typography
const { Panel } = Collapse

const IncompleteTasksContainer = styled.div`
  margin-bottom: 16px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const TasksList = styled.div`
  padding: 8px 0;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`

const DateGroup = styled.div`
  margin-bottom: 16px;
`

const DateLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
`

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
`

interface IncompleteTasksSectionProps {
  onTaskUpdate?: () => void
}

export const IncompleteTasksSection: React.FC<IncompleteTasksSectionProps> = ({ 
  onTaskUpdate 
}) => {
  const [incompleteTasks, setIncompleteTasks] = useState<IncompleteTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
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

  // Load incomplete tasks
  const loadIncompleteTasks = async () => {
    try {
      setIsLoading(true)
      const tasks = await getIncompleteTasks()
      setIncompleteTasks(tasks)
    } catch (error) {
      console.error('Error loading incomplete tasks:', error)
      message.error(`${t('error')}: Failed to load incomplete tasks`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load incomplete tasks on mount and when section is expanded
  useEffect(() => {
    if (!isCollapsed) {
      loadIncompleteTasks()
    }
  }, [isCollapsed])

  // Handle task completion/update
  const handleTaskToggle = async (taskId: string) => {
    try {
      const task = incompleteTasks.find(t => t.id === taskId)
      if (!task) return

      await updateIncompleteTask(task, { completed: !task.completed })
      
      // Remove from incomplete list if completed
      if (!task.completed) {
        setIncompleteTasks(prev => prev.filter(t => t.id !== taskId))
        message.success(t('taskCompleted'))
      }
      
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error updating task:', error)
      message.error(`${t('error')}: Failed to update task`)
    }
  }

  // Handle task deletion
  const handleTaskDelete = async (taskId: string) => {
    try {
      const task = incompleteTasks.find(t => t.id === taskId)
      if (!task) return

      await deleteIncompleteTask(task)
      setIncompleteTasks(prev => prev.filter(t => t.id !== taskId))
      message.success(t('taskDeleted'))
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error deleting task:', error)
      message.error(`${t('error')}: Failed to delete task`)
    }
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return t('today')
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return t('yesterday')
    } else {
      return date.toLocaleDateString(currentLanguage === 'English' ? 'en-US' : 'vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // Group tasks by date
  const groupedTasks = incompleteTasks.reduce((groups, task) => {
    const date = task.originalDate
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(task)
    return groups
  }, {} as Record<string, IncompleteTask[]>)

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a))

  if (incompleteTasks.length === 0 && !isCollapsed) {
    return (
      <IncompleteTasksContainer>
        <Collapse 
          activeKey={isCollapsed ? [] : ['incomplete']}
          onChange={() => setIsCollapsed(!isCollapsed)}
          size="small"
        >
          <Panel 
            key="incomplete"
            header={
              <SectionHeader>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                <Text strong>{t('incompleteTasks')}</Text>
                <Badge count={0} style={{ backgroundColor: '#faad14' }} />
              </SectionHeader>
            }
            showArrow={false}
          >
            <EmptyContainer>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: '#666' }}>
                    {t('noIncompleteTasks')}
                  </Text>
                }
              />
            </EmptyContainer>
          </Panel>
        </Collapse>
      </IncompleteTasksContainer>
    )
  }

  return (
    <IncompleteTasksContainer>
      <Collapse 
        activeKey={isCollapsed ? [] : ['incomplete']}
        onChange={() => setIsCollapsed(!isCollapsed)}
        size="small"
      >
        <Panel 
          key="incomplete"
          header={
            <SectionHeader>
              <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              <Text strong>{t('incompleteTasks')}</Text>
              <Badge count={incompleteTasks.length} style={{ backgroundColor: '#faad14' }} />
            </SectionHeader>
          }
          showArrow={false}
        >
          <TasksList>
            {sortedDates.map((date) => (
              <DateGroup key={date}>
                <DateLabel>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatDate(date)}
                  </Text>
                  <Badge 
                    count={groupedTasks[date].length} 
                    size="small" 
                    style={{ backgroundColor: '#1890ff' }} 
                  />
                </DateLabel>
                
                <AnimatePresence>
                  {groupedTasks[date].map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onDelete={handleTaskDelete}
                    />
                  ))}
                </AnimatePresence>
              </DateGroup>
            ))}
          </TasksList>
        </Panel>
      </Collapse>
    </IncompleteTasksContainer>
  )
}
