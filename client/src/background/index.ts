async function callApi(content: string) {
  try {
      const params = {
          action: 'translate',
          text: content,
          language: 'Vietnamese',
          needExplanation: "false",
          context: 'no specific context',
      };

      const response = await fetch('http://localhost:3000/translate?' + new URLSearchParams(params).toString());
      return response.json();
  } catch (error) {
      console.error('Error calling API:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  callApi("");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (request.action === 'translate') {
      callApi(request.content).then((result) => {
          sendResponse(result);
      }).catch(error => {
          sendResponse({ status: 'API call failed', error: error.message });
      });
      return true;
  }
});
