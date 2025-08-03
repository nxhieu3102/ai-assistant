import React, { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Switch, Button, Divider, Space, Typography, message, Popconfirm } from 'antd'
import { SettingOutlined, ReloadOutlined, ExportOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { 
  PomodoroSettings as SettingsType, 
  loadPomodoroSettings, 
  savePomodoroSettings, 
  DEFAULT_POMODORO_SETTINGS,
  exportPomodoroData,
  resetPomodoroData
} from '../../services/pomodoroStorage'
import { getTranslation, SupportedLanguage } from '../../services/i18n'

const { Title, Text } = Typography

interface PomodoroSettingsProps {
  visible: boolean
  onClose: () => void
  onSettingsChange: (settings: SettingsType) => void
}

const SettingsSection = styled.div`
  margin-bottom: 24px;
  
  .ant-typography {
    margin-bottom: 16px;
  }
`

const FormItem = styled(Form.Item)`
  margin-bottom: 16px;
  
  .ant-form-item-label {
    padding-bottom: 4px;
  }
  
  .ant-form-item-control {
    line-height: 1.5;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
  
  .ant-btn {
    flex: 1;
    min-width: 120px;
  }
`

const InfoText = styled(Text)`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
`

export const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  visible,
  onClose,
  onSettingsChange
}) => {
  const [form] = Form.useForm()
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_POMODORO_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('English')

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

  // Load settings when modal opens
  useEffect(() => {
    if (visible) {
      loadSettings()
    }
  }, [visible])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const loadedSettings = await loadPomodoroSettings()
      setSettings(loadedSettings)
      form.setFieldsValue({
        focusDuration: Math.floor(loadedSettings.focusDuration / 60),
        shortBreakDuration: Math.floor(loadedSettings.shortBreakDuration / 60),
        longBreakDuration: Math.floor(loadedSettings.longBreakDuration / 60),
        longBreakInterval: loadedSettings.longBreakInterval,
        autoStartBreaks: loadedSettings.autoStartBreaks,
        autoStartPomodoros: loadedSettings.autoStartPomodoros,
        notificationsEnabled: loadedSettings.notificationsEnabled,
        soundEnabled: loadedSettings.soundEnabled
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      message.error(`${t('error')}: Failed to load settings`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      const newSettings: SettingsType = {
        focusDuration: values.focusDuration * 60,
        shortBreakDuration: values.shortBreakDuration * 60,
        longBreakDuration: values.longBreakDuration * 60,
        longBreakInterval: values.longBreakInterval,
        autoStartBreaks: values.autoStartBreaks,
        autoStartPomodoros: values.autoStartPomodoros,
        notificationsEnabled: values.notificationsEnabled,
        soundEnabled: values.soundEnabled
      }

      setLoading(true)
      await savePomodoroSettings(newSettings)
      setSettings(newSettings)
      onSettingsChange(newSettings)
      message.success(t('settingsSaved'))
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
      message.error(`${t('error')}: Failed to save settings`)
    } finally {
      setLoading(false)
    }
  }

  const handleResetToDefaults = async () => {
    try {
      setLoading(true)
      await savePomodoroSettings(DEFAULT_POMODORO_SETTINGS)
      setSettings(DEFAULT_POMODORO_SETTINGS)
      form.setFieldsValue({
        focusDuration: Math.floor(DEFAULT_POMODORO_SETTINGS.focusDuration / 60),
        shortBreakDuration: Math.floor(DEFAULT_POMODORO_SETTINGS.shortBreakDuration / 60),
        longBreakDuration: Math.floor(DEFAULT_POMODORO_SETTINGS.longBreakDuration / 60),
        longBreakInterval: DEFAULT_POMODORO_SETTINGS.longBreakInterval,
        autoStartBreaks: DEFAULT_POMODORO_SETTINGS.autoStartBreaks,
        autoStartPomodoros: DEFAULT_POMODORO_SETTINGS.autoStartPomodoros,
        notificationsEnabled: DEFAULT_POMODORO_SETTINGS.notificationsEnabled,
        soundEnabled: DEFAULT_POMODORO_SETTINGS.soundEnabled
      })
      onSettingsChange(DEFAULT_POMODORO_SETTINGS)
      message.success(t('settingsSaved'))
    } catch (error) {
      console.error('Error resetting settings:', error)
      message.error(`${t('error')}: Failed to reset settings`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      setLoading(true)
      const exportedData = await exportPomodoroData()
      
      // Create download link
      const blob = new Blob([exportedData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success(t('dataExported'))
    } catch (error) {
      console.error('Error exporting data:', error)
      message.error(`${t('error')}: Failed to export data`)
    } finally {
      setLoading(false)
    }
  }

  const handleResetAllData = async () => {
    try {
      setLoading(true)
      await resetPomodoroData()
      setSettings(DEFAULT_POMODORO_SETTINGS)
      form.setFieldsValue({
        focusDuration: Math.floor(DEFAULT_POMODORO_SETTINGS.focusDuration / 60),
        shortBreakDuration: Math.floor(DEFAULT_POMODORO_SETTINGS.shortBreakDuration / 60),
        longBreakDuration: Math.floor(DEFAULT_POMODORO_SETTINGS.longBreakDuration / 60),
        longBreakInterval: DEFAULT_POMODORO_SETTINGS.longBreakInterval,
        autoStartBreaks: DEFAULT_POMODORO_SETTINGS.autoStartBreaks,
        autoStartPomodoros: DEFAULT_POMODORO_SETTINGS.autoStartPomodoros,
        notificationsEnabled: DEFAULT_POMODORO_SETTINGS.notificationsEnabled,
        soundEnabled: DEFAULT_POMODORO_SETTINGS.soundEnabled
      })
      onSettingsChange(DEFAULT_POMODORO_SETTINGS)
      message.success(t('dataReset'))
    } catch (error) {
      console.error('Error resetting data:', error)
      message.error(`${t('error')}: Failed to reset data`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>{t('pomodoroSettings')}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={500}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          {t('cancel')}
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          {t('save')}
        </Button>
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          notificationsEnabled: true,
          soundEnabled: true
        }}
      >
        {/* Timer Settings */}
        <SettingsSection>
          <Title level={5}>{t('timerSettings')}</Title>
          
          <FormItem
            label={t('focusDuration')}
            name="focusDuration"
            rules={[
              { required: true, message: 'Please enter focus duration' },
              { type: 'number', min: 1, max: 120, message: 'Duration must be between 1-120 minutes' }
            ]}
          >
            <InputNumber 
              min={1} 
              max={120} 
              addonAfter={t('minutes')}
              style={{ width: '100%' }}
              aria-label={`${t('focusDuration')} in ${t('minutes')}`}
            />
          </FormItem>
          
          <FormItem
            label={t('shortBreakDuration')}
            name="shortBreakDuration"
            rules={[
              { required: true, message: 'Please enter short break duration' },
              { type: 'number', min: 1, max: 60, message: 'Duration must be between 1-60 minutes' }
            ]}
          >
            <InputNumber 
              min={1} 
              max={60} 
              addonAfter={t('minutes')}
              style={{ width: '100%' }}
              aria-label={`${t('shortBreakDuration')} in ${t('minutes')}`}
            />
          </FormItem>
          
          <FormItem
            label={t('longBreakDuration')}
            name="longBreakDuration"
            rules={[
              { required: true, message: 'Please enter long break duration' },
              { type: 'number', min: 1, max: 120, message: 'Duration must be between 1-120 minutes' }
            ]}
          >
            <InputNumber 
              min={1} 
              max={120} 
              addonAfter={t('minutes')}
              style={{ width: '100%' }}
              aria-label={`${t('longBreakDuration')} in ${t('minutes')}`}
            />
          </FormItem>
          
          <FormItem
            label={t('longBreakInterval')}
            name="longBreakInterval"
            rules={[
              { required: true, message: 'Please enter long break interval' },
              { type: 'number', min: 1, max: 12, message: 'Interval must be between 1-12 sessions' }
            ]}
          >
            <InputNumber 
              min={1} 
              max={12} 
              addonAfter={t('sessions')}
              style={{ width: '100%' }}
              aria-label={`${t('longBreakInterval')} in ${t('sessions')}`}
            />
          </FormItem>
          
          <InfoText>
            <InfoCircleOutlined />
            Long break will start after every {form.getFieldValue('longBreakInterval') || 4} focus sessions
          </InfoText>
        </SettingsSection>

        <Divider />

        {/* Behavior Settings */}
        <SettingsSection>
          <Title level={5}>{t('behaviorSettings')}</Title>
          
          <FormItem
            label={t('autoStartBreaks')}
            name="autoStartBreaks"
            valuePropName="checked"
          >
            <Switch aria-label={t('autoStartBreaks')} />
          </FormItem>
          
          <FormItem
            label={t('autoStartPomodoros')}
            name="autoStartPomodoros"
            valuePropName="checked"
          >
            <Switch aria-label={t('autoStartPomodoros')} />
          </FormItem>
        </SettingsSection>

        <Divider />

        {/* Notification Settings */}
        <SettingsSection>
          <Title level={5}>{t('notificationSettings')}</Title>
          
          <FormItem
            label={t('notificationsEnabled')}
            name="notificationsEnabled"
            valuePropName="checked"
          >
            <Switch aria-label={t('notificationsEnabled')} />
          </FormItem>
          
          <FormItem
            label={t('soundEnabled')}
            name="soundEnabled"
            valuePropName="checked"
          >
            <Switch aria-label={t('soundEnabled')} />
          </FormItem>
        </SettingsSection>

        <Divider />

        {/* Data Management */}
        <SettingsSection>
          <Title level={5}>Data Management</Title>
          
          <ButtonGroup>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetToDefaults}
              disabled={loading}
              aria-label={t('resetToDefaults')}
            >
              {t('resetToDefaults')}
            </Button>
            
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportData}
              disabled={loading}
              aria-label={t('exportData')}
            >
              {t('exportData')}
            </Button>
            
            <Popconfirm
              title={t('confirmReset')}
              description={t('confirmResetMessage')}
              onConfirm={handleResetAllData}
              okText={t('delete')}
              cancelText={t('cancel')}
              okType="danger"
              disabled={loading}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={loading}
                aria-label={t('resetAllData')}
              >
                {t('resetAllData')}
              </Button>
            </Popconfirm>
          </ButtonGroup>
        </SettingsSection>
      </Form>
    </Modal>
  )
}
