import React from 'react'
import { Checkbox, Button, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import styled from 'styled-components'

const { Text } = Typography

export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string
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
`

const TaskText = styled(Text)<{ completed: boolean }>`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: ${props => props.completed ? '#52c41a' : '#262626'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  opacity: ${props => props.completed ? 0.7 : 1};
  word-break: break-word;
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

  ${TaskContainer}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: #ff4d4f;
    border-color: #ff4d4f;
    color: #ffffff;
    transform: scale(1.1);
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
`

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  return (
    <TaskContainer
      completed={task.completed}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <StyledCheckbox
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      
      <TaskText completed={task.completed}>
        {task.text}
      </TaskText>
      
      <DeleteButton
        type="text"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(task.id)}
        title="Delete task"
        size="small"
      />
    </TaskContainer>
  )
}
