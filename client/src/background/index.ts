// Function to call an API
async function callApi() {
  try {
      const response = await fetch('https://catfact.ninja/fact', {
          method: 'GET', // or 'POST', 'PUT', etc.
          headers: {
              'Content-Type': 'application/json',
          }
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
  } catch (error) {
      console.error('Error calling API:', error);
  }
}

// Example of calling the function when the extension is loaded
chrome.runtime.onInstalled.addListener(() => {
  callApi();
});


console.log('background is running')
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callApi') {
      callApi().then(() => {
          sendResponse({ status: 'API call completed' });
      }).catch(error => {
          sendResponse({ status: 'API call failed', error: error.message });
      });
      return true; // Indicates that response will be sent asynchronously
  }
});
