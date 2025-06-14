// ==UserScript==
// @name         Subscription Protected Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Example script that checks subscription status before running
// @author       Your Name
// @match        https://example.com/*
// @match        https://*.example.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

;(() => {
  // Configuration - Replace with your actual API endpoint
  const CONFIG = {
    API_BASE_URL: "https://your-app-domain.vercel.app/api/subscription",
    API_KEY: "", // Will be set by user
    SUBSCRIPTION_CODE: "", // Will be set by user
    CHECK_INTERVAL: 24 * 60 * 60 * 1000, // Check every 24 hours
    CACHE_KEY: "subscription_status",
    LAST_CHECK_KEY: "last_subscription_check",
  }

  // Subscription status cache
  let subscriptionStatus = null
  let isInitialized = false

  // Initialize the script
  async function init() {
    if (isInitialized) return
    isInitialized = true

    console.log("🔐 Subscription Protected Script - Initializing...")

    // Load saved credentials
    CONFIG.API_KEY = GM_getValue("api_key", "")
    CONFIG.SUBSCRIPTION_CODE = GM_getValue("subscription_code", "")

    // Add menu commands for configuration
    GM_registerMenuCommand("⚙️ Configure API Key", promptForApiKey)
    GM_registerMenuCommand("🔑 Configure Subscription Code", promptForSubscriptionCode)
    GM_registerMenuCommand("🔄 Check Subscription Status", () => checkSubscription(true))
    GM_registerMenuCommand("📊 View Subscription Info", showSubscriptionInfo)
    GM_registerMenuCommand("🗑️ Clear Cache", clearCache)

    // Check if credentials are configured
    if (!CONFIG.API_KEY || !CONFIG.SUBSCRIPTION_CODE) {
      showWelcomeMessage()
      return
    }

    // Check subscription status
    const isValid = await checkSubscription()

    if (isValid) {
      console.log("✅ Subscription verified - Starting main script...")
      startMainScript()
    } else {
      console.log("❌ Subscription invalid - Script blocked")
      showSubscriptionError()
    }
  }

  // Check subscription status
  async function checkSubscription(forceCheck = false) {
    try {
      const lastCheck = GM_getValue(CONFIG.LAST_CHECK_KEY, 0)
      const now = Date.now()

      // Use cached result if recent and not forcing check
      if (!forceCheck && now - lastCheck < CONFIG.CHECK_INTERVAL) {
        const cached = GM_getValue(CONFIG.CACHE_KEY, null)
        if (cached) {
          subscriptionStatus = JSON.parse(cached)
          console.log("📋 Using cached subscription status")
          return subscriptionStatus.valid
        }
      }

      console.log("🔍 Checking subscription status...")

      const response = await makeApiRequest("/verify", "POST", {
        subscription_code: CONFIG.SUBSCRIPTION_CODE,
      })

      if (response.valid) {
        subscriptionStatus = response
        GM_setValue(CONFIG.CACHE_KEY, JSON.stringify(response))
        GM_setValue(CONFIG.LAST_CHECK_KEY, now)

        GM_notification({
          title: "✅ Subscription Active",
          text: `Plan: ${response.subscription.plan}\nExpires: ${new Date(response.subscription.end_date).toLocaleDateString()}`,
          timeout: 3000,
        })

        return true
      } else {
        subscriptionStatus = response
        clearCache()

        GM_notification({
          title: "❌ Subscription Invalid",
          text: response.error || "Please check your subscription",
          timeout: 5000,
        })

        return false
      }
    } catch (error) {
      console.error("❌ Subscription check failed:", error)

      GM_notification({
        title: "⚠️ Connection Error",
        text: "Could not verify subscription. Check your internet connection.",
        timeout: 5000,
      })

      // Allow script to run if we have a recent valid cache
      const cached = GM_getValue(CONFIG.CACHE_KEY, null)
      if (cached) {
        const cachedStatus = JSON.parse(cached)
        const lastCheck = GM_getValue(CONFIG.LAST_CHECK_KEY, 0)
        const gracePeriod = 7 * 24 * 60 * 60 * 1000 // 7 days grace period

        if (cachedStatus.valid && Date.now() - lastCheck < gracePeriod) {
          console.log("🕐 Using cached subscription (grace period)")
          return true
        }
      }

      return false
    }
  }

  // Make API request with proper headers
  function makeApiRequest(endpoint, method = "GET", data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        url: CONFIG.API_BASE_URL + endpoint,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": CONFIG.API_KEY,
        },
        onload: (response) => {
          try {
            const result = JSON.parse(response.responseText)
            if (response.status >= 200 && response.status < 300) {
              resolve(result)
            } else {
              reject(new Error(result.error || `HTTP ${response.status}`))
            }
          } catch (e) {
            reject(new Error("Invalid JSON response"))
          }
        },
        onerror: (error) => {
          reject(new Error("Network error"))
        },
        ontimeout: () => {
          reject(new Error("Request timeout"))
        },
        timeout: 10000,
      }

      if (data) {
        options.data = JSON.stringify(data)
      }

      GM_xmlhttpRequest(options)
    })
  }

  // Configuration functions
  function promptForApiKey() {
    const apiKey = prompt("Enter your API Key:", CONFIG.API_KEY)
    if (apiKey !== null) {
      CONFIG.API_KEY = apiKey.trim()
      GM_setValue("api_key", CONFIG.API_KEY)
      GM_notification({
        title: "🔑 API Key Updated",
        text: "API Key has been saved",
        timeout: 2000,
      })
    }
  }

  function promptForSubscriptionCode() {
    const code = prompt("Enter your Subscription Code:", CONFIG.SUBSCRIPTION_CODE)
    if (code !== null) {
      CONFIG.SUBSCRIPTION_CODE = code.trim()
      GM_setValue("subscription_code", CONFIG.SUBSCRIPTION_CODE)
      GM_notification({
        title: "🎫 Subscription Code Updated",
        text: "Subscription code has been saved",
        timeout: 2000,
      })
    }
  }

  function clearCache() {
    GM_setValue(CONFIG.CACHE_KEY, "")
    GM_setValue(CONFIG.LAST_CHECK_KEY, 0)
    subscriptionStatus = null
    console.log("🗑️ Cache cleared")
  }

  // UI Functions
  function showWelcomeMessage() {
    const welcomeDiv = document.createElement("div")
    welcomeDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f0f8ff;
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 20px;
                max-width: 300px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            ">
                <h3 style="margin: 0 0 10px 0; color: #333;">🔐 Setup Required</h3>
                <p style="margin: 0 0 15px 0; font-size: 14px;">
                    Please configure your API credentials to use this script.
                </p>
                <div style="display: flex; gap: 10px; flex-direction: column;">
                    <button id="setup-api-key" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Set API Key</button>
                    <button id="setup-sub-code" style="
                        background: #2196F3;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Set Subscription Code</button>
                    <button id="close-welcome" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Close</button>
                </div>
            </div>
        `

    document.body.appendChild(welcomeDiv)

    // Add event listeners
    document.getElementById("setup-api-key").onclick = () => {
      promptForApiKey()
      document.body.removeChild(welcomeDiv)
    }

    document.getElementById("setup-sub-code").onclick = () => {
      promptForSubscriptionCode()
      document.body.removeChild(welcomeDiv)
    }

    document.getElementById("close-welcome").onclick = () => {
      document.body.removeChild(welcomeDiv)
    }

    // Auto-close after 30 seconds
    setTimeout(() => {
      if (document.body.contains(welcomeDiv)) {
        document.body.removeChild(welcomeDiv)
      }
    }, 30000)
  }

  function showSubscriptionInfo() {
    if (!subscriptionStatus) {
      alert("No subscription information available. Please check your subscription first.")
      return
    }

    let message = ""
    if (subscriptionStatus.valid) {
      const sub = subscriptionStatus.subscription
      message =
        `✅ Subscription Active\n\n` +
        `Plan: ${sub.plan}\n` +
        `Status: ${sub.status}\n` +
        `Expires: ${new Date(sub.end_date).toLocaleDateString()}\n` +
        `Auto-renew: ${sub.auto_renew ? "Yes" : "No"}\n\n` +
        `Features:\n${sub.features.map((f) => `• ${f}`).join("\n")}`
    } else {
      message = `❌ Subscription Invalid\n\nError: ${subscriptionStatus.error}`
    }

    alert(message)
  }

  function showSubscriptionError() {
    const errorDiv = document.createElement("div")
    errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ffebee;
                border: 2px solid #f44336;
                border-radius: 8px;
                padding: 30px;
                max-width: 400px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                text-align: center;
            ">
                <h2 style="margin: 0 0 15px 0; color: #d32f2f;">❌ Access Denied</h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                    Your subscription is not valid or has expired.
                </p>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                    ${subscriptionStatus?.error || "Please check your subscription status."}
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            </div>
        `

    document.body.appendChild(errorDiv)
  }

  // Your main script functionality goes here
  function startMainScript() {
    console.log("🚀 Starting main script functionality...")

    // Add a visual indicator that the script is active
    const indicator = document.createElement("div")
    indicator.innerHTML = "✅ Script Active"
    indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `
    document.body.appendChild(indicator)

    // Remove indicator after 3 seconds
    setTimeout(() => {
      if (document.body.contains(indicator)) {
        document.body.removeChild(indicator)
      }
    }, 3000)

    // ========================================
    // PUT YOUR MAIN SCRIPT FUNCTIONALITY HERE
    // ========================================

    // Example: Add a custom button to the page
    addCustomButton()

    // Example: Modify page content
    enhancePage()

    // Example: Add keyboard shortcuts
    addKeyboardShortcuts()
  }

  // Example functions - replace with your actual functionality
  function addCustomButton() {
    const button = document.createElement("button")
    button.innerHTML = "🔧 Custom Feature"
    button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `

    button.onclick = () => {
      alert("Custom feature activated! 🎉\n\nThis is where your main functionality would go.")
    }

    document.body.appendChild(button)
  }

  function enhancePage() {
    // Example: Change page background color slightly
    document.body.style.filter = "hue-rotate(5deg)"

    // Example: Add a watermark
    const watermark = document.createElement("div")
    watermark.innerHTML = "Enhanced by Your Script"
    watermark.style.cssText = `
            position: fixed;
            bottom: 5px;
            left: 5px;
            font-size: 10px;
            color: rgba(0,0,0,0.3);
            z-index: 9998;
            pointer-events: none;
        `
    document.body.appendChild(watermark)
  }

  function addKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Example: Ctrl+Shift+S to show subscription info
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault()
        showSubscriptionInfo()
      }

      // Example: Ctrl+Shift+R to refresh subscription
      if (e.ctrlKey && e.shiftKey && e.key === "R") {
        e.preventDefault()
        checkSubscription(true)
      }
    })
  }

  // Wait for page to load, then initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
