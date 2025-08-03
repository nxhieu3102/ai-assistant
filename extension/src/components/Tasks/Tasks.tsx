import React, { useState, useEffect } from 'react'
import { Typography, Empty, Divider, message } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import { TaskInput } from './TaskInput'
import { TaskItem, Task } from './TaskItem'
import { loadTodaysTasks, saveTodaysTasks, getTaskStats, cleanupOldTasks } from '../../services/taskStorage'

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
          message.info('Uncompleted tasks from yesterday have been moved to today!')
        }
        
        // Cleanup old tasks in the background
        cleanupOldTasks(30).catch(console.error)
        
      } catch (error) {
        console.error('Error loading tasks:', error)
        message.error('Failed to load tasks')
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
        message.error('Failed to save tasks')
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
    return <div>Loading tasks...</div>
  }

  return (
    <TasksContainer>
      <TasksHeader>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          📋 Today's Tasks
        </Title>
        <TasksStats>
          <StatItem>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text>{completedCount}</Text>
          </StatItem>
          <StatItem>
            <ClockCircleOutlined style={{ color: '#faad14' }} />
            <Text>{pendingCount}</Text>
          </StatItem>
        </TasksStats>
      </TasksHeader>

      <TaskInput onAddTask={addTask} placeholder="What needs to be done today?" />

      {totalTasks === 0 ? (
        <EmptyContainer>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: '#999' }}>
                No tasks yet. Add your first task above!
              </span>
            }
          />
        </EmptyContainer>
      ) : (
        <TasksList>
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
              <Divider style={{ margin: '16px 0', fontSize: '12px', color: '#999' }}>
                Completed ({completedTasks.length})
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
