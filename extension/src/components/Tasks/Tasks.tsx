import React, { useState, useEffect } from 'react'
import { Typography, Empty, Divider, message } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import { TaskInput } from './TaskInput'
import { TaskItem, Task } from './TaskItem'
import { loadTodaysTasks, saveTodaysTasks, getTaskStats, cleanupOldTasks } from '../../services/taskStorage'
import { getTranslation, SupportedLanguage } from '../../services/i18n'

const { Title, Text } = Typography

const TasksContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`

const TasksHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
`

const TasksStats = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
`

const TasksList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding-right: 4px;

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

  &:focus {
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
`

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`



export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMigrated, setHasMigrated] = useState(false)
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

  // Load tasks from storage on component mount with automatic migration
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true)
        const loadedTasks = await loadTodaysTasks()
        setTasks(loadedTasks)
        setHasMigrated(true)
        
        // Show migration message if we have tasks that might be from yesterday
        const hasTasksFromToday = loadedTasks.some(task => {
          const taskDate = new Date(task.createdAt).toDateString()
          const today = new Date().toDateString()
          return taskDate === today
        })
        
        const hasOlderTasks = loadedTasks.some(task => {
          const taskDate = new Date(task.createdAt).toDateString()
          const today = new Date().toDateString()
          return taskDate !== today
        })
        
        if (hasOlderTasks && !hasTasksFromToday) {
          message.info(t('tasksMigrated'))
        }
        
        // Cleanup old tasks in the background
        cleanupOldTasks(30).catch(console.error)
        
      } catch (error) {
        console.error('Error loading tasks:', error)
        message.error(`${t('error')}: Failed to load tasks`)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTasks()
  }, [])

  // Save tasks to storage whenever tasks change (but not during initial load)
  useEffect(() => {
    if (!isLoading && hasMigrated) {
      saveTodaysTasks(tasks).catch((error) => {
        console.error('Error saving tasks:', error)
        message.error(`${t('error')}: Failed to save tasks`)
      })
    }
  }, [tasks, isLoading, hasMigrated])

  const addTask = (taskText: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString()
    }
    setTasks(prevTasks => [newTask, ...prevTasks])
  }

  const toggleTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    )
  }

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
  }

  const { completed: completedCount, pending: pendingCount, total: totalTasks } = getTaskStats(tasks)
  const completedTasks = tasks.filter(task => task.completed)
  const pendingTasks = tasks.filter(task => !task.completed)

  if (isLoading) {
    return <div>{t('loading')}</div>
  }

  return (
    <TasksContainer role="main" aria-labelledby="tasks-heading">
      <TasksHeader>
        <Title 
          id="tasks-heading" 
          level={4} 
          style={{ margin: 0, color: '#1890ff' }}
          aria-live="polite"
        >
          📋 {t('todaysTasks')}
        </Title>
        <TasksStats aria-label="Task statistics">
          <StatItem aria-label={`${completedCount} completed tasks`}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} aria-hidden="true" />
            <Text>{completedCount}</Text>
          </StatItem>
          <StatItem aria-label={`${pendingCount} pending tasks`}>
            <ClockCircleOutlined style={{ color: '#faad14' }} aria-hidden="true" />
            <Text>{pendingCount}</Text>
          </StatItem>
        </TasksStats>
      </TasksHeader>

      <TaskInput onAddTask={addTask} placeholder={t('taskPlaceholder')} />

      {totalTasks === 0 ? (
        <EmptyContainer role="status" aria-live="polite">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: '#666' }}> {/* Improved contrast */}
                {t('noTasksYet')}
              </span>
            }
          />
        </EmptyContainer>
      ) : (
        <TasksList 
          role="list" 
          aria-label={`${totalTasks} tasks, ${pendingCount} pending, ${completedCount} completed`}
          tabIndex={0}
        >
          <AnimatePresence>
            {/* Show pending tasks first */}
            {pendingTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
            
            {/* Divider between pending and completed */}
            {pendingTasks.length > 0 && completedTasks.length > 0 && (
              <Divider 
                style={{ margin: '16px 0', fontSize: '12px', color: '#666' }} /* Improved contrast */
              >
                {t('completedTasks')} ({completedTasks.length})
              </Divider>
            )}
            
            {/* Show completed tasks at bottom */}
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </AnimatePresence>
        </TasksList>
      )}
    </TasksContainer>
  )
}
