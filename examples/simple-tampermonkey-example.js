// ==UserScript==
// @name         Simple Subscription Check
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Minimal example of subscription checking
// @author       You
// @match        https://example.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

;(() => {
  // Configuration
  const API_URL = "https://your-app-domain.vercel.app/api/subscription/verify"
  const API_KEY = "your-api-key-here"
  const SUBSCRIPTION_CODE = "your-subscription-code-here"

  // Check subscription and run script
  async function checkAndRun() {
    try {
      const isValid = await verifySubscription()

      if (isValid) {
        console.log("✅ Subscription valid - Running script")
        runMainScript()
      } else {
        console.log("❌ Subscription invalid - Blocking script")
        alert("Your subscription is not valid. Please check your subscription status.")
      }
    } catch (error) {
      console.error("Subscription check failed:", error)
      alert("Could not verify subscription. Please check your internet connection.")
    }
  }

  // Verify subscription with API
  function verifySubscription() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: API_URL,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        data: JSON.stringify({
          subscription_code: SUBSCRIPTION_CODE,
        }),
        onload: (response) => {
          try {
            const result = JSON.parse(response.responseText)
            resolve(result.valid === true)
          } catch (e) {
            reject(new Error("Invalid response"))
          }
        },
        onerror: () => {
          reject(new Error("Network error"))
        },
      })
    })
  }

  // Your main script functionality
  function runMainScript() {
    // Add your script functionality here
    console.log("🚀 Main script is running!")

    // Example: Add a button to the page
    const button = document.createElement("button")
    button.textContent = "Custom Feature"
    button.style.cssText = "position:fixed;top:10px;right:10px;z-index:9999;"
    button.onclick = () => alert("Feature activated!")
    document.body.appendChild(button)
  }

  // Start the script
  checkAndRun()
})()
