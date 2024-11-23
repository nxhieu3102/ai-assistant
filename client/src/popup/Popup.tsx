import { useState, useEffect, useRef } from 'react'
import { Spin, Input } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

export const Popup = () => {
  const [selectedText, setSelectedText] = useState('')
  const [translation, setTranslation] = useState('')
  const popupRef = useRef(null)

  const fetchTranslation = async (text: string) => {
    const params = {
      action: 'translate',
      text,
      language: 'Vietnamese',
      needExplanation: 'false',
      context: 'no specific context',
    }
    const response = await fetch(
      'http://localhost:3000/translate?' + new URLSearchParams(params).toString(),
    )

    console.log(response)
    const data = await response.json()
    return data.content
  }

  const handleClick = async () => {
    if (selectedText) {
      const translatedText = await fetchTranslation(selectedText)
      setTranslation(translatedText)
    }
  }

  const handleClosePopup = () => {
    setSelectedText('')
    setTranslation('')
  }

  useEffect(() => {
    chrome.storage.local.get('selections', async (result) => {
      const selections = result.selections || []
      const validSelection = selections.findLast((s: string) => s.length > 0)
      if (validSelection) {
        setSelectedText(validSelection)
        const translatedText = await fetchTranslation(validSelection)
        setTranslation(translatedText)
      }
      chrome.storage.local.set({ selections: [] })
    })
  }, [])

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
        <span>{selectedText.length > 0 ? selectedText : <Input onChange={}/>}</span>
        <span>
          <h3
            style={{
              marginBottom: '8px',
              color: 'rgb(38, 38, 38)',
              fontWeight: 'bold',
            }}
          >
            Vietnamese
          </h3>
          <span>
            {selectedText.length > 0 && translation.length == 0 ? (
              <Spin indicator={<LoadingOutlined spin />} />
            ) : (
              translation
            )}
          </span>
        </span>
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
      {translation.length == 0 && (
        <button onClick={handleClick} style={{ marginTop: '10px' }}>
          Translate
        </button>
      )}
    </div>
  )
}
