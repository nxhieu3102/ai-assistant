import React from 'react'
import { Typography, Card } from 'antd'
import styled from 'styled-components'

const { Title, Text } = Typography

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px;
`

const PlaceholderCard = styled(Card)`
  width: 100%;
  border-radius: 8px;
  .ant-card-body {
    padding: 32px;
  }
`

export const PomoPlaceholder: React.FC = () => {
  return (
    <PlaceholderContainer>
      <PlaceholderCard>
        <Title level={4} style={{ color: '#ff6b6b', marginBottom: '16px' }}>
          🍅 Pomo
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Pomodoro timer coming soon...
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: '14px', marginTop: '8px' }}>
          Focus timer with 25-minute work sessions and 5-minute breaks.
        </Text>
      </PlaceholderCard>
    </PlaceholderContainer>
  )
}
