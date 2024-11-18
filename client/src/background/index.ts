async function callApi() {
  try {
      const response = await fetch('http://localhost:3000/translate', {
          method: 'GET', 
          headers: {
              'Content-Type': 'application/json',
          }
      });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data
  } catch (error) {
      console.error('Error calling API:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  callApi();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (request.action === 'translate') {
      callApi().then((result) => {
          sendResponse(result);
      }).catch(error => {
          sendResponse({ status: 'API call failed', error: error.message });
      });
      return true;
  }
});
