// src/contentScript.js
try {
  // Şifre formlarını tespit et
  function detectForms() {
    try {
      const passwordFields = document.querySelectorAll(
        'input[type="password"]'
      );
      if (passwordFields.length > 0) {
        chrome.runtime
          .sendMessage({
            type: "FORM_DETECTED",
            url: window.location.href,
          })
          .catch((err) => console.log("Send message error:", err));
      }
    } catch (error) {
      console.log("Error in detectForms:", error);
    }
  }

  // Şifre doldurma
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.type === "FILL_CREDENTIALS") {
        const { username, password } = request.credentials;

        // Form elementlerini bul
        const usernameField = document.querySelector(
          'input[type="text"], input[type="email"]'
        );
        const passwordField = document.querySelector('input[type="password"]');

        // Değerleri doldur
        if (usernameField) usernameField.value = username;
        if (passwordField) passwordField.value = password;
      }
    } catch (error) {
      console.log("Error handling message:", error);
    }
  });

  // Dinamik form değişikliklerini izle
  const observer = new MutationObserver(detectForms);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // İlk yüklemede kontrol et
  detectForms();
} catch (error) {
  console.log("ContentScript main error:", error);
}
