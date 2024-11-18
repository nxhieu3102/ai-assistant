let lastSelection = '';

type Message = {
  action: string
  content: any
}

const sendMessage = (message: Message) => {
  chrome.runtime.sendMessage(message, function (response) {
    console.log('Background response:', response)
    if (response && response.content) {
      const messageBox = document.createElement('div')
      messageBox.style.position = 'fixed'
      messageBox.style.bottom = '20px'
      messageBox.style.right = '20px'
      messageBox.style.padding = '10px'
      messageBox.style.backgroundColor = 'white'
      messageBox.style.border = '1px solid black'
      messageBox.style.zIndex = '1001'
      messageBox.innerText = response.content
      document.body.appendChild(messageBox)
      setTimeout(() => {
        document.body.removeChild(messageBox)
      }, 5000)
    }
  })
}

const handleClick = () => {
  if (lastSelection.length > 0) {
    sendMessage({ 
      action: 'translate',
      content: lastSelection.toString()
    })
  }
}

const createIcon = () => {
  const icon = document.createElement('div')
  icon.id = 'selection-icon'
  icon.style.position = 'absolute'
  icon.style.width = '48px'
  icon.style.height = '48px'
  const ImageUrl = chrome.runtime.getURL('img/icon.png')
  icon.style.background = `url(${ImageUrl})`
  icon.style.backgroundSize = 'contain'
  icon.style.cursor = 'pointer'
  icon.addEventListener('click', handleClick)
  return icon
}

document.addEventListener('selectionchange', () => {
  const selection = document.getSelection()
  if (selection && selection.toString().length > 0) {
    lastSelection = selection.toString();
    let icon = document.getElementById('selection-icon')
    if (!icon) {
      icon = createIcon()
    }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    icon.style.top = `${rect.top + window.scrollY - 30}px`
    icon.style.left = `${rect.left + window.scrollX}px`
    icon.style.display = 'block'
    icon.style.zIndex = '1000'
    icon.style.pointerEvents = 'auto'
    document.body.appendChild(icon)
  }
})
