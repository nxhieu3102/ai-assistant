import { useState, useEffect, useRef } from 'react'
import { 
  Spin, 
  Input, 
  Button, 
  Select, 
  Divider, 
  Typography, 
  Card,
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
  SwapOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import styled from 'styled-components'

const { Text, Title } = Typography
const { Panel } = Collapse
const { Option } = Select

const HOST = import.meta.env.VITE_HOST
const PORT = import.meta.env.VITE_PORT

// Available languages for translation
const LANGUAGES = [
  'English',
  'Vietnamese',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
  'Arabic'
] as const

// Define TypeScript types for translation
type SupportedLanguage = typeof LANGUAGES[number]
type TranslationKey = 'translate' | 'summarize' | 'smooth' | 'targetLanguage' | 'defaultLanguage' | 'summary' | 'enterText' | 'context' | 'addContext'

type TranslationSet = {
  [key in TranslationKey]: string
}

type Translations = {
  [key in SupportedLanguage]?: TranslationSet
}

// UI translations
const UI_TRANSLATIONS: Translations = {
  English: {
    translate: 'Translate',
    summarize: 'Summarize',
    smooth: 'Smooth',
    targetLanguage: 'Target Language',
    defaultLanguage: 'Default Language',
    summary: 'Summary',
    enterText: 'Enter text...',
    context: 'Context',
    addContext: 'Add context to improve results'
  },
  Vietnamese: {
    translate: 'Dịch',
    summarize: 'Tóm tắt',
    smooth: 'Làm mượt',
    targetLanguage: 'Ngôn ngữ đích',
    defaultLanguage: 'Ngôn ngữ mặc định',
    summary: 'Tóm tắt',
    enterText: 'Nhập văn bản...',
    context: 'Ngữ cảnh',
    addContext: 'Thêm ngữ cảnh để cải thiện kết quả'
  },
  Spanish: {
    translate: 'Traducir',
    summarize: 'Resumir',
    smooth: 'Suavizar',
    targetLanguage: 'Idioma de destino',
    defaultLanguage: 'Idioma predeterminado',
    summary: 'Resumen',
    enterText: 'Ingrese texto...',
    context: 'Contexto',
    addContext: 'Añadir contexto para mejorar los resultados'
  },
  French: {
    translate: 'Traduire',
    summarize: 'Résumer',
    smooth: 'Lisser',
    targetLanguage: 'Langue cible',
    defaultLanguage: 'Langue par défaut',
    summary: 'Résumé',
    enterText: 'Entrez du texte...',
    context: 'Contexte',
    addContext: 'Ajouter du contexte pour améliorer les résultats'
  },
  German: {
    translate: 'Übersetzen',
    summarize: 'Zusammenfassen',
    smooth: 'Glätten',
    targetLanguage: 'Zielsprache',
    defaultLanguage: 'Standardsprache',
    summary: 'Zusammenfassung',
    enterText: 'Text eingeben...',
    context: 'Kontext',
    addContext: 'Kontext hinzufügen, um Ergebnisse zu verbessern'
  },
  Chinese: {
    translate: '翻译',
    summarize: '总结',
    smooth: '润色',
    targetLanguage: '目标语言',
    defaultLanguage: '默认语言',
    summary: '摘要',
    enterText: '请输入文本...',
    context: '上下文',
    addContext: '添加上下文以改善结果'
  },
  Japanese: {
    translate: '翻訳',
    summarize: '要約',
    smooth: '滑らかに',
    targetLanguage: '対象言語',
    defaultLanguage: 'デフォルト言語',
    summary: '要約',
    enterText: 'テキストを入力...',
    context: 'コンテキスト',
    addContext: '結果を向上させるためのコンテキストを追加'
  },
  Korean: {
    translate: '번역',
    summarize: '요약',
    smooth: '매끄럽게',
    targetLanguage: '대상 언어',
    defaultLanguage: '기본 언어',
    summary: '요약',
    enterText: '텍스트를 입력하세요...',
    context: '맥락',
    addContext: '결과를 개선하기 위한 맥락 추가'
  },
  Russian: {
    translate: 'Перевести',
    summarize: 'Резюмировать',
    smooth: 'Сгладить',
    targetLanguage: 'Целевой язык',
    defaultLanguage: 'Язык по умолчанию',
    summary: 'Сводка',
    enterText: 'Введите текст...',
    context: 'Контекст',
    addContext: 'Добавьте контекст для улучшения результатов'
  },
  Arabic: {
    translate: 'ترجمة',
    summarize: 'تلخيص',
    smooth: 'تنعيم',
    targetLanguage: 'اللغة المستهدفة',
    defaultLanguage: 'اللغة الافتراضية',
    summary: 'ملخص',
    enterText: 'أدخل النص...',
    context: 'السياق',
    addContext: 'أضف سياقًا لتحسين النتائج'
  }
  // Other languages can be added as needed
}

// Styled components
const PopupContainer = motion.div
const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  .ant-card-body {
    padding: 20px;
  }
`

const LanguageSelector = styled.div`
  margin-bottom: 16px;
  .ant-select {
    width: 100%;
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

export const Popup = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [inputText, setInputText] = useState('')
  const [action, setAction] = useState('')
  const [result, setResult] = useState('')
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('Vietnamese')
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>('English')
  const [contextText, setContextText] = useState('')
  const [showContextInput, setShowContextInput] = useState(false)
  const popupRef = useRef(null)

  // Get UI translations based on selected default language
  const getTranslation = (key: TranslationKey): string => {
    const translations = UI_TRANSLATIONS[defaultLanguage] || UI_TRANSLATIONS.English
    return translations?.[key] || UI_TRANSLATIONS.English?.[key] || key
  }

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
    let needTranslateText = selectedText.length > 0 ? selectedText : inputText
    if (needTranslateText.length > 0) {
      const translatedText = await fetchTranslation(needTranslateText)
      if (translatedText) {
        setResult(translatedText)
        setAction('translate')
      }
    }
  }

  const handleClickSummarize = async () => {
    let needSummarizeText = selectedText.length > 0 ? selectedText : inputText
    if (needSummarizeText.length > 0) {
      const summarizedText = await fetchSummarize(needSummarizeText)
      if (summarizedText) {
        setResult(summarizedText)
        setAction('summarize')
      }
    }
  }

  const handleClickSmooth = async () => {
    let needSmoothText = selectedText.length > 0 ? selectedText : inputText
    if (needSmoothText.length > 0) {
      const smoothedText = await fetchSmooth(needSmoothText)
      if (smoothedText) {
        setResult(smoothedText)
        setAction('smooth')
      }
    }
  }

  const handleClosePopup = () => {
    setSelectedText('')
    setResult('')
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

  return (
    <PopupContainer
      ref={popupRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <StyledCard>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Language Selection */}
          <div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <GlobalOutlined />
                <Text strong>{getTranslation('defaultLanguage')}</Text>
                <Tooltip title="Select your preferred interface language">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Space>
              <Select
                value={defaultLanguage}
                onChange={handleDefaultLanguageChange}
                style={{ width: '100%' }}
              >
                {LANGUAGES.map(lang => (
                  <Option key={`default-${lang}`} value={lang}>{lang}</Option>
                ))}
              </Select>
            </Space>
          </div>

          <div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <TranslationOutlined />
                <Text strong>{getTranslation('targetLanguage')}</Text>
                <Tooltip title="Select the language you want to translate to">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Space>
              <Select
                value={targetLanguage}
                onChange={handleTargetLanguageChange}
                style={{ width: '100%' }}
              >
                {LANGUAGES.map(lang => (
                  <Option key={`target-${lang}`} value={lang}>{lang}</Option>
                ))}
              </Select>
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
                  <Text>{getTranslation('addContext')}</Text>
                </Space>
              } 
              key="1"
            >
              <ContextInput>
                <Input.TextArea
                  value={contextText}
                  onChange={handleContextChange}
                  placeholder={getTranslation('context')}
                  rows={3}
                />
              </ContextInput>
            </Panel>
          </Collapse>

          <Divider />

          {/* Text Input */}
          <div>
            {selectedText.length > 0 ? (
              <Card size="small" style={{ background: '#f5f5f5' }}>
                <Text>{selectedText}</Text>
              </Card>
            ) : (
              <Input.TextArea
                placeholder={getTranslation('enterText')}
                onChange={handleInputChange}
                rows={4}
              />
            )}
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
                      {action === 'translate' ? targetLanguage : getTranslation('summary')}
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
              {getTranslation('translate')}
            </Button>
            <Button 
              onClick={handleClickSummarize}
              loading={isProcessing && action === 'summarize'}
            >
              {getTranslation('summarize')}
            </Button>
            <Button 
              onClick={handleClickSmooth}
              loading={isProcessing && action === 'smooth'}
            >
              {getTranslation('smooth')}
            </Button>
          </ActionButtons>
        </Space>

        {/* Close Button */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClosePopup}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </StyledCard>
    </PopupContainer>
  )
}
