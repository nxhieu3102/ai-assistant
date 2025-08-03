import React, { useState, KeyboardEvent } from 'react'
import { Input, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import styled from 'styled-components'

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
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  &::placeholder {
    color: #bfbfbf;
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
`

export const TaskInput: React.FC<TaskInputProps> = ({ 
  onAddTask, 
  placeholder = "Add a new task..." 
}) => {
  const [inputValue, setInputValue] = useState('')

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
    <InputContainer>
      <StyledInput
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPressEnter={handleKeyPress}
        placeholder={placeholder}
        maxLength={200}
        autoFocus
      />
      <AddButton
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddTask}
        disabled={!inputValue.trim()}
        title="Add task (Enter)"
      />
    </InputContainer>
  )
}
