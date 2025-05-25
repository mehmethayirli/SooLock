// src/background.js
try {
  // Form tespiti için dinleyici
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "FORM_DETECTED") {
      chrome.action
        .setBadgeText({
          text: "!",
          tabId: sender.tab.id,
        })
        .catch((err) => console.log("Badge error:", err));
    }
  });

  // Extension yüklendiğinde
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local
      .set({
        isInitialized: false,
        walletConnected: false,
      })
      .catch((err) => console.log("Storage error:", err));
  });
} catch (error) {
  console.log("Background script error:", error);
}
