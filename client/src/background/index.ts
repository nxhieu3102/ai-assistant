const HOST = import.meta.env.VITE_HOST;
const PORT = import.meta.env.VITE_PORT;

console.log(HOST, PORT);
async function translate(content: string) {
  try {
    const params = {
      action: 'translate',
      text: content,
      language: 'Vietnamese',
      needExplanation: 'false',
      context: 'no specific context',
    }

    const response = await fetch(
      `${HOST}:${PORT}/translate?` + new URLSearchParams(params).toString(),
    )
    return response.json()
  } catch (error) {
    console.error('Error calling API:', error)
  }
}

async function save(content: string, translation: string) {
  try {
    const params = {
      initialText: content,
      translation: translation,
    }

    const response = await fetch(
      `${HOST}:${PORT}/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
    )
    return response.json()
  } catch (error) {
    console.error('Error calling API:', error)
  }
}

// chrome.runtime.onStartup.addListener( () => {
//   console.log(`onStartup()`);
// });

chrome.runtime.onInstalled.addListener(() => {
  // translate('')
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translate(request.content)
      .then((result) => {
        sendResponse(result)
      })
      .catch((error) => {
        sendResponse({ status: 'API call failed', error: error.message })
      })
    return true
  }
  if (request.action === 'save') {
    try {
      save(request.content, request.translation)
      sendResponse({ status: 'saved' })
    } catch (error) {
      sendResponse({ status: 'failed', error: 's' })
    }
    return true
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    await chrome.storage.local.clear()
  } catch (error) {
    console.error('Error removing storage key:', error)
  }
})
