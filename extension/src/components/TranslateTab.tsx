import { useState, useEffect, useRef } from 'react'
import { 
  Spin, 
  Input, 
  Button, 
  Select, 
  Divider, 
  Typography, 
  Space,
  Collapse,
  Tooltip,
  message
} from 'antd'
import { 
  LoadingOutlined, 
  GlobalOutlined, 
  TranslationOutlined,
  InfoCircleOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import { getTranslation, SupportedLanguage, LANGUAGES } from '../services/i18n'

const { Text, Title } = Typography
const { Panel } = Collapse
const { Option } = Select

const HOST = import.meta.env.VITE_HOST
const PORT = import.meta.env.VITE_PORT

const LanguageRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  .ant-select { 
    flex: 1; 
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  .ant-btn {
    flex: 1;
  }
`

const ResultContainer = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 100px;
`

const ContextInput = styled.div`
  margin-top: 16px;
  .ant-input {
    border-radius: 8px;
  }
`

export const TranslateTab = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [inputText, setInputText] = useState('')
  const [action, setAction] = useState('')
  const [result, setResult] = useState('')
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('Vietnamese')
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>('English')
  const [contextText, setContextText] = useState('')
  const [showContextInput, setShowContextInput] = useState(false)

  // Helper function to get translations
  const t = (key: any) => getTranslation(key, defaultLanguage)

  const fetchTranslation = async (text: string) => {
    setIsProcessing(true)
    try {
      const params = {
        text,
        language: targetLanguage,
        needExplanation: 'false',
        context: contextText || 'no specific context',
      }
      const response = await fetch(
        `${HOST}:${PORT}/translate?` + new URLSearchParams(params).toString(),
      )
      const data = await response.json()
      return data.content
    } catch (error) {
      message.error('Translation failed. Please try again.')
      return ''
    } finally {
      setIsProcessing(false)
    }
  }

  const fetchSummarize = async (text: string) => {
    setIsProcessing(true)
    try {
      const params = {
        text,
        context: contextText || 'no specific context',
      }
      const response = await fetch(
        `${HOST}:${PORT}/summarize?` + new URLSearchParams(params).toString(),
      )
      const data = await response.json()
      return data.content
    } catch (error) {
      message.error('Summarization failed. Please try again.')
      return ''
    } finally {
      setIsProcessing(false)
    }
  }

  const fetchSmooth = async (text: string) => {
    setIsProcessing(true)
    try {
      const params = {
        text,
        context: contextText || 'no specific context',
      }
      const response = await fetch(
        `${HOST}:${PORT}/smooth?` + new URLSearchParams(params).toString(),
      )
      const data = await response.json()
      return data.content
    } catch (error) {
      message.error('Smoothing failed. Please try again.')
      return ''
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClickTranslate = async () => {
    if (inputText.length > 0) {
      const translatedText = await fetchTranslation(inputText)
      if (translatedText) {
        setResult(translatedText)
        setAction('translate')
      }
    }
  }

  const handleClickSummarize = async () => {
    if (inputText.length > 0) {
      const summarizedText = await fetchSummarize(inputText)
      if (summarizedText) {
        setResult(summarizedText)
        setAction('summarize')
      }
    }
  }

  const handleClickSmooth = async () => {
    if (inputText.length > 0) {
      const smoothedText = await fetchSmooth(inputText)
      if (smoothedText) {
        setResult(smoothedText)
        setAction('smooth')
      }
    }
  }

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContextText(e.target.value)
    chrome.storage.sync.set({ contextText: e.target.value })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
  }

  // Load user preferences on component mount
  useEffect(() => {
    chrome.storage.sync.get(['targetLanguage', 'defaultLanguage', 'contextText'], (result) => {
      if (result.targetLanguage && LANGUAGES.includes(result.targetLanguage)) {
        setTargetLanguage(result.targetLanguage as SupportedLanguage)
      }
      if (result.defaultLanguage && LANGUAGES.includes(result.defaultLanguage)) {
        setDefaultLanguage(result.defaultLanguage as SupportedLanguage)
      }
      if (result.contextText) {
        setContextText(result.contextText)
        setShowContextInput(true)
      }
    })
    
    chrome.storage.local.get('selections', async (result) => {
      const selections = result.selections || []
      const validSelection = selections.pop()
      if (validSelection && validSelection.length > 0) {
        setSelectedText(validSelection)
        setInputText(validSelection) // Make selected text editable
      }
      chrome.storage.local.set({ selections: [] })
    })
  }, [])

  const handleTargetLanguageChange = (value: SupportedLanguage) => {
    setTargetLanguage(value)
    chrome.storage.sync.set({ targetLanguage: value })
  }

  const handleDefaultLanguageChange = (value: SupportedLanguage) => {
    setDefaultLanguage(value)
    chrome.storage.sync.set({ defaultLanguage: value })
  }

  const handleSwapLanguages = () => {
    setDefaultLanguage(targetLanguage)
    setTargetLanguage(defaultLanguage)
    chrome.storage.sync.set({
      defaultLanguage: targetLanguage,
      targetLanguage: defaultLanguage,
    })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Language Selection */}
      <div>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <GlobalOutlined />
            <Text strong>{t('defaultLanguage')}</Text>
            <SwapOutlined style={{ margin: '0 8px' }} />
            <TranslationOutlined />
            <Text strong>{t('targetLanguage')}</Text>
          </Space>
          <LanguageRow>
            <Select
              value={defaultLanguage}
              onChange={handleDefaultLanguageChange}
              placeholder="Default Language"
            >
              {LANGUAGES.map(lang => (
                <Option key={`default-${lang}`} value={lang}>{lang}</Option>
              ))}
            </Select>
            <Tooltip title="Swap languages">
              <Button
                shape="circle"
                icon={<SwapOutlined />}
                onClick={handleSwapLanguages}
                size="small"
              />
            </Tooltip>
            <Select
              value={targetLanguage}
              onChange={handleTargetLanguageChange}
              placeholder="Target Language"
            >
              {LANGUAGES.map(lang => (
                <Option key={`target-${lang}`} value={lang}>{lang}</Option>
              ))}
            </Select>
          </LanguageRow>
        </Space>
      </div>

      {/* Context Input */}
      <Collapse
        activeKey={showContextInput ? ['1'] : []}
        onChange={(keys) => setShowContextInput(keys.includes('1'))}
      >
        <Panel 
          header={
            <Space>
              <SwapOutlined />
              <Text>{t('addContext')}</Text>
            </Space>
          } 
          key="1"
        >
          <ContextInput>
            <Input.TextArea
              value={contextText}
              onChange={handleContextChange}
              placeholder={t('context')}
              rows={3}
            />
          </ContextInput>
        </Panel>
      </Collapse>

      <Divider />

      {/* Text Input */}
      <div>
        <Input.TextArea
          value={inputText}
          placeholder={t('enterText')}
          onChange={handleInputChange}
          rows={4}
        />
      </div>

      {/* Result */}
      <AnimatePresence>
        {result.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ResultContainer>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>
                  {action === 'translate' ? targetLanguage : t('summary')}
                </Title>
                <Text>{result}</Text>
              </Space>
            </ResultContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <ActionButtons>
        <Button 
          type="primary" 
          onClick={handleClickTranslate}
          loading={isProcessing && action === 'translate'}
        >
          {t('translate')}
        </Button>
        <Button 
          onClick={handleClickSummarize}
          loading={isProcessing && action === 'summarize'}
        >
          {t('summarize')}
        </Button>
        <Button 
          onClick={handleClickSmooth}
          loading={isProcessing && action === 'smooth'}
        >
          {t('smooth')}
        </Button>
      </ActionButtons>
    </Space>
  )
}
