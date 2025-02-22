import { useState, useEffect, useRef } from 'react'
import { Spin, Input, Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const HOST = import.meta.env.VITE_HOST
const PORT = import.meta.env.VITE_PORT

export const Popup = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [inputText, setInputText] = useState('')
  const [action, setAction] = useState('')
  const [result, setResult] = useState('')
  const popupRef = useRef(null)

  const fetchTranslation = async (text: string) => {
    setIsProcessing(true)
    const params = {
      text,
      language: 'Vietnamese',
      needExplanation: 'false',
      context: 'no specific context',
    }
    const response = await fetch(
      `${HOST}:${PORT}/translate?` + new URLSearchParams(params).toString(),
    )
    const data = await response.json()
    setIsProcessing(false)
    return data.content
  }

  const fetchSummarize = async (text: string) => {
    setIsProcessing(true)
    const params = {
      text,
      context: 'no specific context',
    }
    const response = await fetch(
      `${HOST}:${PORT}/summarize?` + new URLSearchParams(params).toString(),
    )
    const data = await response.json()
    setIsProcessing(false)
    return data.content
  }

  const fetchSmooth = async (text: string) => {
    setIsProcessing(true)
    const params = {
      text,
      context: 'no specific context',
    }
    const response = await fetch(
      `${HOST}:${PORT}/smooth?` + new URLSearchParams(params).toString(),
    )
    const data = await response.json()
    setIsProcessing(false)
    return data.content
  }

  const handleClickTranslate = async () => {
    let needTranslateText = selectedText.length > 0 ? selectedText : inputText
    if (needTranslateText.length > 0) {
      const translatedText = await fetchTranslation(needTranslateText)
      setResult(translatedText)
      setAction('translate')
    }
  }

  const handleClickSummarize = async () => {
    let needSummarizeText = selectedText.length > 0 ? selectedText : inputText
    if (needSummarizeText.length > 0) {
      const summarizedText = await fetchSummarize(needSummarizeText)
      setResult(summarizedText)
      setAction('summarize')
    }
  }

  const handleClickSmooth = async () => {
    let needSmoothText = selectedText.length > 0 ? selectedText : inputText
    if (needSmoothText.length > 0) {
      const summarizedText = await fetchSmooth(needSmoothText)
      setResult(summarizedText)
      setAction('summarize')
    }
  }


  const handleClosePopup = () => {
    setSelectedText('')
    setResult('')
  }

  useEffect(() => {
    chrome.storage.local.get('selections', async (result) => {
      const selections = result.selections || []
      const validSelection = selections.pop()
      if (validSelection && validSelection.length > 0) {
        setSelectedText(validSelection)
      }
      chrome.storage.local.set({ selections: [] })
    })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
  }
  return (
    <div
      ref={popupRef}
      style={{
        width: '400px',
        background: '#fff',
        borderRadius: '6px',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        fontSize: '14px',
        color: '#333',
        zIndex: 1001,
      }}
    >
      <select
        style={{
          width: '100%',
          padding: '5px',
          marginBottom: '10px',
          borderRadius: '8px',
          color: 'white',
          backgroundColor: '#2a2a2a',
        }}
      >
        <option>English</option>
        <option>Vietnamese</option>
      </select>
      <div className="translation">
        <span>
          {selectedText.length > 0 ? selectedText : <Input onChange={handleInputChange} />}
        </span>
        <span>
          {result.length > 0 &&
            (action === 'translate' ? (
              <h3
                style={{
                  marginBottom: '8px',
                  color: 'rgb(38, 38, 38)',
                  fontWeight: 'bold',
                }}
              >
                Vietnamese
              </h3>
            ) : (
              <h3
                style={{
                  marginBottom: '8px',
                  color: 'rgb(38, 38, 38)',
                  fontWeight: 'bold',
                }}
              >
                Summary
              </h3>
            ))}
          <span>{isProcessing ? <Spin indicator={<LoadingOutlined spin />} /> : result}</span>
        </span>
      </div>

      <button
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '16px',
        }}
        onClick={handleClosePopup}
      >
        ✕
      </button>

      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-start' }}>
        <Button onClick={handleClickTranslate} style={{ marginRight: '10px' }}>
          Translate
        </Button>
        <Button onClick={handleClickSummarize} style={{ marginRight: '10px' }}>Summarize</Button>
        <Button onClick={handleClickSmooth}>Smooth</Button>
      </div>

      <div className="footer" style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
        <a
          href="#"
          style={{
            color: '#007acc',
            textDecoration: 'none',
          }}
          onClick={(e) => e.preventDefault()}
        >
          Extension Options
        </a>
      </div>
    </div>
  )
}
