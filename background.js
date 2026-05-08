// Tech Detector Pro v3.0 — Service Worker

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[TechDetector] Installed v3.0.0 — Welcome!');
  } else if (reason === 'update') {
    console.log('[TechDetector] Updated to v3.0.0');
    // Clear old cached data on update so it rescans fresh
    chrome.storage.local.remove(['lastData', 'frozen']);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[TechDetector] Browser started');
});

// Re-inject content script when a tab fully loads
// (handles cases where the popup was opened before page finished loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(() => {}); // silently ignore restricted pages (chrome://, etc.)
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TechDetector] Message:', message?.action || message);
  sendResponse({ success: true });
});