console.info('contentScript is running')
document.addEventListener('selectionchange', () => {
  const selection = document.getSelection()
  if (selection && selection.toString().length > 0) {
    console.log('User selected text:', selection.toString())
    let icon = document.getElementById('selection-icon')
    if (!icon) {
      icon = document.createElement('div')
      icon.id = 'selection-icon'
      icon.style.position = 'absolute'
      icon.style.width = '48px'
      icon.style.height = '48px'
      const ImageUrl = chrome.runtime.getURL('img/logo-128.png')
      console.log(ImageUrl)
      console.log(`url(${ImageUrl}) no-repeat center center`)
      icon.style.background = `url(${ImageUrl})`
      icon.style.backgroundSize = 'contain'
      icon.style.cursor = 'pointer'
      icon.addEventListener('click', () => {
        // Sending a message from the content script to the background script
        // Sending a message to the background script
        chrome.runtime.sendMessage({ action: 'callApi' }, function (response) {
          console.log('Background response:', response)
        })

        console.log('clicked')
        alert('Icon clicked!')
      })
    }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    icon.style.top = `${rect.top + window.scrollY - 30}px`
    icon.style.left = `${rect.left + window.scrollX}px`
    icon.style.display = 'block'
    icon.style.zIndex = '9999'
    icon.style.pointerEvents = 'auto'
    document.body.appendChild(icon)
  }
})
