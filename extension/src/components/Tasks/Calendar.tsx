import React, { useState, useEffect } from 'react'
import { Calendar as AntCalendar, Badge, Tooltip, Button, Modal, message } from 'antd'
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons'
import { Dayjs } from 'dayjs'
import styled from 'styled-components'
import { TaskInput } from './TaskInput'
import { 
  TaskCountsByDate, 
  getTaskCountsByDate, 
  createTask, 
  getDateString 
} from '../../services/taskApi'
import { getTranslation, SupportedLanguage } from '../../services/i18n'

const CalendarContainer = styled.div`
  .ant-picker-calendar {
    background: #ffffff;
    border-radius: 8px;
    padding: 16px;
  }

  .ant-picker-calendar-header {
    padding: 0 0 16px 0;
  }

  .ant-picker-cell {
    position: relative;
  }

  .ant-picker-cell-inner {
    position: relative;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .ant-picker-cell:hover .ant-picker-cell-inner {
    background: #f0f0f0;
  }

  .ant-picker-cell-selected .ant-picker-cell-inner {
    background: #1890ff;
    color: white;
  }

  .ant-picker-cell-disabled .ant-picker-cell-inner {
    color: #d9d9d9;
    cursor: not-allowed;
  }

  .task-indicator {
    position: absolute;
    top: 2px;
    right: 2px;
    z-index: 1;
  }

  .ant-picker-calendar-mode-switch {
    display: none;
  }
`

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const AddTaskModal = styled(Modal)`
  .ant-modal-body {
    padding: 24px;
  }
`

interface CalendarProps {
  onDateSelect?: (date: string) => void
  onTaskCreated?: () => void
  selectedDate?: string
}

export const Calendar: React.FC<CalendarProps> = ({
  onDateSelect,
  onTaskCreated,
  selectedDate
}) => {
  const [taskCounts, setTaskCounts] = useState<TaskCountsByDate>({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedDateForTask, setSelectedDateForTask] = useState<string>('')
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

  // Load task counts for calendar indicators
  const loadTaskCounts = async () => {
    try {
      const counts = await getTaskCountsByDate()
      setTaskCounts(counts)
    } catch (error) {
      console.error('Error loading task counts:', error)
    }
  }

  useEffect(() => {
    loadTaskCounts()
  }, [])

  // Handle date selection
  const handleDateSelect = (date: Dayjs) => {
    const dateString = date.format('YYYY-MM-DD')
    onDateSelect?.(dateString)
  }

  // Handle double-click to create task for future dates
  const handleDateDoubleClick = (date: Dayjs) => {
    const dateString = date.format('YYYY-MM-DD')
    const today = getDateString()
    
    // Only allow creating tasks for today or future dates
    if (dateString >= today) {
      setSelectedDateForTask(dateString)
      setIsModalVisible(true)
    } else {
      message.warning(t('cannotCreateTasksForPastDates'))
    }
  }

  // Create task for selected date
  const handleCreateTask = async (text: string) => {
    try {
      await createTask(text, selectedDateForTask)
      message.success(t('taskCreated'))
      setIsModalVisible(false)
      onTaskCreated?.()
      loadTaskCounts() // Reload task counts to update indicators
    } catch (error) {
      console.error('Error creating task:', error)
      message.error(`${t('error')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Custom cell renderer for calendar dates
  const cellRender = (current: Dayjs) => {
    const dateString = current.format('YYYY-MM-DD')
    const counts = taskCounts[dateString]
    
    if (!counts || counts.total === 0) {
      return null
    }

    const indicator = counts.incomplete > 0 
      ? <Badge count={counts.incomplete} size="small" style={{ backgroundColor: '#faad14' }} />
      : <Badge count={counts.completed} size="small" style={{ backgroundColor: '#52c41a' }} />

    return (
      <Tooltip 
        title={`${counts.total} tasks (${counts.completed} completed, ${counts.incomplete} incomplete)`}
        placement="top"
      >
        <div className="task-indicator">
          {indicator}
        </div>
      </Tooltip>
    )
  }

  // Format date for modal title
  const formatDateForModal = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = tomorrow.toISOString().split('T')[0]

    if (dateString === today) {
      return t('today')
    } else if (dateString === tomorrowString) {
      return t('tomorrow')
    } else {
      return date.toLocaleDateString(currentLanguage === 'English' ? 'en-US' : 'vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  return (
    <CalendarContainer>
      <CalendarHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {t('calendar')}
          </span>
        </div>
        <Tooltip title={t('doubleClickToCreateTask')}>
          <Button 
            type="text" 
            size="small" 
            icon={<PlusOutlined />}
            style={{ color: '#666' }}
          >
            {t('addTask')}
          </Button>
        </Tooltip>
      </CalendarHeader>

      <div
        onDoubleClick={(event) => {
          const target = event.target as HTMLElement
          const cell = target.closest('.ant-picker-cell')
          if (cell) {
            const titleAttr = cell.getAttribute('title')
            if (titleAttr) {
              try {
                const dayjs = require('dayjs')
                const date = dayjs(titleAttr)
                if (date.isValid()) {
                  handleDateDoubleClick(date)
                }
              } catch (error) {
                console.error('Error parsing date:', error)
              }
            }
          }
        }}
      >
        <AntCalendar
          fullscreen={false}
          cellRender={cellRender}
          onSelect={handleDateSelect}
          onPanelChange={(date) => {
            // Refresh task counts when changing months
            loadTaskCounts()
          }}
        />
      </div>

      <AddTaskModal
        title={`${t('addTaskFor')} ${formatDateForModal(selectedDateForTask)}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={400}
      >
        <TaskInput
          onAddTask={handleCreateTask}
          placeholder={`${t('taskPlaceholder')} (${formatDateForModal(selectedDateForTask)})`}
        />
      </AddTaskModal>
    </CalendarContainer>
  )
}
