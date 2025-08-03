import React, { useState, useEffect } from 'react'
import { Typography, Card, Row, Col, Statistic, Empty, Spin, Button, Space, Popconfirm } from 'antd'
import { 
  FireOutlined, 
  ClockCircleOutlined, 
  TrophyOutlined, 
  CalendarOutlined,
  ExportOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import styled from 'styled-components'
import { getTranslation, SupportedLanguage } from '../../services/i18n'
import { 
  loadTodaysSessions, 
  loadWeeklyStats, 
  exportPomodoroData,
  resetPomodoroData,
  PomodoroStats as StatsType,
  PomodoroSession,
  getDateKey
} from '../../services/pomodoroStorage'

const { Title, Text } = Typography

interface PomodoroStatsProps {
  onExport?: () => void
  onReset?: () => void
}

const StatsContainer = styled.div`
  width: 100%;
  padding: 16px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const ChartContainer = styled.div`
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  min-height: 200px;
  
  .recharts-cartesian-axis-tick-value {
    font-size: 12px;
    fill: #666;
  }
  
  .recharts-tooltip-wrapper {
    .recharts-default-tooltip {
      background: rgba(255, 255, 255, 0.95) !important;
      border: 1px solid #d9d9d9 !important;
      border-radius: 6px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
  
  .ant-btn {
    min-width: 120px;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`

export const PomodoroStats: React.FC<PomodoroStatsProps> = ({ onExport, onReset }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('English')
  const [todaysSessions, setTodaysSessions] = useState<PomodoroSession[]>([])
  const [weeklyStats, setWeeklyStats] = useState<StatsType[]>([])
  const [loading, setLoading] = useState(true)

  // Load current language
  useEffect(() => {
    chrome.storage.sync.get(['defaultLanguage'], (result) => {
      if (result.defaultLanguage) {
        setCurrentLanguage(result.defaultLanguage as SupportedLanguage)
      }
    })
  }, [])

  // Helper function to get translations
  const t = (key: any) => getTranslation(key, currentLanguage)

  // Load statistics data
  useEffect(() => {
    loadStatsData()
  }, [])

  const loadStatsData = async () => {
    try {
      setLoading(true)
      const [sessions, stats] = await Promise.all([
        loadTodaysSessions(),
        loadWeeklyStats()
      ])
      setTodaysSessions(sessions)
      setWeeklyStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate today's statistics
  const todaysStats = React.useMemo(() => {
    const focusSessions = todaysSessions.filter(s => s.mode === 'focus')
    const focusMinutes = focusSessions.reduce((total, s) => total + Math.floor(s.duration / 60), 0)
    const breakSessions = todaysSessions.filter(s => s.mode !== 'focus')
    
    // Calculate longest streak today
    const longestStreak = calculateTodaysStreak(focusSessions)
    
    return {
      focusSessions: focusSessions.length,
      focusMinutes,
      breakSessions: breakSessions.length,
      totalSessions: todaysSessions.length,
      longestStreak
    }
  }, [todaysSessions])

  // Calculate longest streak for today's sessions
  const calculateTodaysStreak = (sessions: PomodoroSession[]): number => {
    if (sessions.length === 0) return 0
    
    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    
    let maxStreak = 1
    let currentStreak = 1
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const prevTime = new Date(sortedSessions[i - 1].completedAt)
      const currentTime = new Date(sortedSessions[i].completedAt)
      const timeDiff = currentTime.getTime() - prevTime.getTime()
      
      // Sessions within 60 minutes are considered part of the same streak
      if (timeDiff <= 60 * 60 * 1000) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }
    
    return maxStreak
  }

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = getDateKey(date)
      
      const dayStats = weeklyStats.find(stat => stat.date === dateKey)
      
      last7Days.push({
        date: dateKey,
        day: date.toLocaleDateString(currentLanguage === 'English' ? 'en-US' : 'vi-VN', { weekday: 'short' }),
        focusMinutes: dayStats?.focusMinutesCompleted || 0,
        sessions: dayStats?.focusSessionsCompleted || 0
      })
    }
    
    return last7Days
  }, [weeklyStats, currentLanguage])

  // Calculate weekly averages
  const weeklyAverages = React.useMemo(() => {
    if (weeklyStats.length === 0) return { avgFocusMinutes: 0, avgSessions: 0 }
    
    const totalFocusMinutes = weeklyStats.reduce((sum, stat) => sum + stat.focusMinutesCompleted, 0)
    const totalSessions = weeklyStats.reduce((sum, stat) => sum + stat.focusSessionsCompleted, 0)
    
    return {
      avgFocusMinutes: Math.round(totalFocusMinutes / 7),
      avgSessions: Math.round(totalSessions / 7 * 10) / 10
    }
  }, [weeklyStats])

  const handleExport = async () => {
    try {
      const exportedData = await exportPomodoroData()
      
      // Create download link
      const blob = new Blob([exportedData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pomodoro-stats-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      onExport?.()
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const handleReset = async () => {
    try {
      await resetPomodoroData()
      await loadStatsData() // Reload data
      onReset?.()
    } catch (error) {
      console.error('Error resetting data:', error)
    }
  }

  const hasData = todaysSessions.length > 0 || weeklyStats.length > 0

  if (loading) {
    return (
      <StatsContainer>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>{t('loading')}</Text>
          </div>
        </div>
      </StatsContainer>
    )
  }

  if (!hasData) {
    return (
      <StatsContainer>
        <EmptyState>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <Text style={{ fontSize: '16px' }}>{t('noDataYet')}</Text>
                <Text type="secondary">{t('startFirstSession')}</Text>
              </Space>
            }
          />
        </EmptyState>
      </StatsContainer>
    )
  }

  return (
    <StatsContainer>
      {/* Today's Statistics */}
      <Title level={5} style={{ marginBottom: '16px', color: '#ff6b6b' }}>
        📊 {t('todaysStats')}
      </Title>
      
      <StatsGrid>
        <Card size="small">
          <Statistic
            title={t('focusMinutes')}
            value={todaysStats.focusMinutes}
            prefix={<ClockCircleOutlined style={{ color: '#ff6b6b' }} />}
            suffix="min"
            valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
          />
        </Card>
        
        <Card size="small">
          <Statistic
            title={t('completedSessions')}
            value={todaysStats.focusSessions}
            prefix={<FireOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
          />
        </Card>
        
        <Card size="small">
          <Statistic
            title={t('longestStreak')}
            value={todaysStats.longestStreak}
            prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
          />
        </Card>
      </StatsGrid>

      {/* Weekly Chart */}
      <Title level={5} style={{ marginBottom: '16px', color: '#1890ff' }}>
        📈 {t('lastSevenDays')}
      </Title>
      
      <ChartContainer>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value} ${name === 'focusMinutes' ? 'minutes' : 'sessions'}`,
                name === 'focusMinutes' ? t('focusMinutes') : t('focusSession')
              ]}
              labelFormatter={(label: string) => `${label}`}
            />
            <Bar 
              dataKey="focusMinutes" 
              fill="#ff6b6b" 
              radius={[4, 4, 0, 0]}
              name="focusMinutes"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Weekly Averages */}
      <Title level={5} style={{ marginBottom: '16px', color: '#52c41a' }}>
        📊 {t('averageDaily')}
      </Title>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={`${t('averageDaily')} - ${t('focusMinutes')}`}
              value={weeklyAverages.avgFocusMinutes}
              suffix="min"
              valueStyle={{ fontSize: '16px', color: '#ff6b6b' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={`${t('averageDaily')} - ${t('sessions')}`}
              value={weeklyAverages.avgSessions}
              valueStyle={{ fontSize: '16px', color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <ActionButtons>
        <Button
          icon={<ExportOutlined />}
          onClick={handleExport}
          aria-label={t('exportData')}
        >
          {t('exportData')}
        </Button>
        
        <Popconfirm
          title={t('confirmReset')}
          description={t('confirmResetMessage')}
          onConfirm={handleReset}
          okText={t('delete')}
          cancelText={t('cancel')}
          okType="danger"
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            aria-label={t('resetAllData')}
          >
            {t('resetAllData')}
          </Button>
        </Popconfirm>
      </ActionButtons>
    </StatsContainer>
  )
}
