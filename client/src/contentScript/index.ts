const style = document.createElement('style')
style.innerHTML = `
  .popup {
    width: 400px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    font-size: 14px;
    color: #333;
    position: absolute;
    z-index: 1001;
  }

  .popup select {
    width: 100%;
    padding: 5px;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .translation {
    margin-bottom: 10px;
  }

  .translation span {
    display: block;
    margin-bottom: 4px;
  }

  .footer {
    text-align: right;
    font-size: 12px;
    color: #555;
  }

  .footer a {
    color: #007acc;
    text-decoration: none;
  }

  .footer a:hover {
    text-decoration: underline;
  }
`

document.head.appendChild(style)

let lastSelection: {
  text: string
  ranges: Range[]
  anchorNode?: Node | null
  focusNode?: Node | null
} | null = null

type Message = {
  action: string
  content: any
}

const updateSelections = (selection: string) => {
  chrome.storage.local.get('selections', (result) => {
    const selections = result.selections || []
    selections.push(selection)
    chrome.storage.local.set({ selections })
  })
}

const sendMessage = (message: Message) => {
  chrome.runtime.sendMessage(message, function (response) {
    if (response && response.content && lastSelection) {
      let popup = document.getElementById('translation-popup')
      if (!popup) {
        popup = document.createElement('div')
        popup.id = 'translation-popup'
        popup.className = 'popup'
      }

      popup.style.display = 'block'
      popup.innerHTML = `
        <select style="border-radius: 8px; color:white; background-color: #2a2a2a;">
          <option>English</option>
          <option>Vietnamese</option>
        </select>
        <div class="translation">
          
          <span>
            <span>${message.content}</span>
          </span>

          <span>
              <h3 style="margin-bottom: 8px; color:rgb(38 38 38/var(--tw-text-opacity)); font-weight:bold">Vietnamese</h3>
              <span>${response.content}</span>
          </span>          
        </div>
        <div class="footer">
          <a href="#">Extension Options</a>
        </div>
      `

      const range = lastSelection.ranges[lastSelection.ranges.length - 1]
      const rect = range.getBoundingClientRect()
      popup.style.top = `${rect.bottom + window.scrollY + 5}px`
      popup.style.left = `${rect.left + window.scrollX}px`

      if (!document.getElementById('translation-popup')) {
        document.body.appendChild(popup)
      }
    }
  })
}
const handleClick = () => {
  const selectionIcon = document.getElementById('selection-icon')
  if (selectionIcon) {
    selectionIcon.style.display = 'none'
  }
  if (lastSelection && lastSelection.toString().length > 0) {
    sendMessage({
      action: 'translate',
      content: lastSelection.text,
    })
  }
}

const createIcon = () => {
  const icon = document.createElement('div')
  icon.id = 'selection-icon'
  icon.style.position = 'absolute'
  icon.style.width = '24px'
  icon.style.height = '24px'
  const ImageUrl = chrome.runtime.getURL('img/icon.png')
  icon.style.background = `url(${ImageUrl})`
  icon.style.backgroundSize = 'contain'
  icon.style.cursor = 'pointer'
  icon.addEventListener('click', handleClick)
  return icon
}

document.addEventListener('selectionchange', () => {
  const selection = document.getSelection()
  if(selection) {
    updateSelections(selection.toString())
  }
  if (
    selection &&
    (selection.anchorNode === document.getElementById('selection-icon') ||
      selection.focusNode === document.getElementById('selection-icon') ||
      selection.anchorNode === document.getElementById('translation-popup') ||
      selection.focusNode === document.getElementById('translation-popup') ||
      selection.anchorNode?.parentElement?.closest('#translation-popup') ||
      selection.focusNode?.parentElement?.closest('#translation-popup'))
  ) {
    return
  }

  let icon = document.getElementById('selection-icon')
  if (icon) {
    icon.style.display = 'none'
  }

  let popup = document.getElementById('translation-popup')
  if (popup) {
    popup.style.display = 'none'
  }
  if (selection && selection.toString().length > 0) {
    lastSelection = {
      text: selection.toString(),
      ranges: Array.from({ length: selection.rangeCount }, (_, i) =>
        selection.getRangeAt(i).cloneRange(),
      ),
      anchorNode: selection.anchorNode,
      focusNode: selection.focusNode,
    }
  }
})

document.addEventListener('mouseup', (event) => {
  let icon = document.getElementById('selection-icon')
  if (!icon) {
    icon = createIcon()
  }
  const selection = document.getSelection();
  if (selection && selection.toString().length > 0) {
    icon.style.top = `${event.clientY + window.scrollY + 5}px`
    icon.style.left = `${event.clientX + window.scrollX}px`
    icon.style.display = 'block'
    icon.style.zIndex = '1000'
    icon.style.pointerEvents = 'auto'
    document.body.appendChild(icon)
  }
})
