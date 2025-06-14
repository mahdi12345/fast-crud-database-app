// ==UserScript==
// @name         Device-Protected Subscription Script
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Subscription script with device fingerprinting and session management
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
  // Configuration
  const CONFIG = {
    API_BASE_URL: "https://your-app-domain.vercel.app/api/subscription",
    API_KEY: "",
    SUBSCRIPTION_CODE: "",
    SESSION_TOKEN: "",
    CHECK_INTERVAL: 60 * 60 * 1000, // Check every hour
    HEARTBEAT_INTERVAL: 5 * 60 * 1000, // Heartbeat every 5 minutes
  }

  let subscriptionStatus = null
  let isInitialized = false
  let heartbeatTimer = null

  // Device fingerprinting
  function generateDeviceFingerprint() {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillText("Device fingerprint", 2, 2)

    return {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      deviceName: `${navigator.platform} - ${navigator.userAgent.split(")")[0]})`,
      canvasFingerprint: canvas.toDataURL(),
    }
  }

  // Initialize the script
  async function init() {
    if (isInitialized) return
    isInitialized = true

    console.log("🔐 Device-Protected Script - Initializing...")

    // Load saved credentials
    CONFIG.API_KEY = GM_getValue("api_key", "")
    CONFIG.SUBSCRIPTION_CODE = GM_getValue("subscription_code", "")
    CONFIG.SESSION_TOKEN = GM_getValue("session_token", "")

    // Add menu commands
    GM_registerMenuCommand("⚙️ Configure API Key", promptForApiKey)
    GM_registerMenuCommand("🔑 Configure Subscription Code", promptForSubscriptionCode)
    GM_registerMenuCommand("🔄 Check Subscription Status", () => checkSubscription(true))
    GM_registerMenuCommand("📊 View Subscription Info", showSubscriptionInfo)
    GM_registerMenuCommand("🚪 Logout Device", logoutDevice)
    GM_registerMenuCommand("🗑️ Clear All Data", clearAllData)

    // Check if credentials are configured
    if (!CONFIG.API_KEY || !CONFIG.SUBSCRIPTION_CODE) {
      showWelcomeMessage()
      return
    }

    // Check subscription and device status
    const isValid = await checkSubscription()

    if (isValid) {
      console.log("✅ Device and subscription verified - Starting main script...")
      startMainScript()
      startHeartbeat()
    } else {
      console.log("❌ Device/subscription invalid - Script blocked")
      showSubscriptionError()
    }
  }

  // Check subscription with device verification
  async function checkSubscription(forceCheck = false) {
    try {
      console.log("🔍 Checking subscription and device status...")

      const deviceData = generateDeviceFingerprint()

      const response = await makeApiRequest("/verify-device", "POST", {
        subscription_code: CONFIG.SUBSCRIPTION_CODE,
        device_data: deviceData,
        session_token: CONFIG.SESSION_TOKEN || undefined,
      })

      if (response.valid) {
        subscriptionStatus = response

        // Save session token
        if (response.session_token) {
          CONFIG.SESSION_TOKEN = response.session_token
          GM_setValue("session_token", CONFIG.SESSION_TOKEN)
        }

        GM_notification({
          title: "✅ Device Verified",
          text: `Plan: ${response.subscription.plan}\nMax devices: ${response.subscription.max_devices}`,
          timeout: 3000,
        })

        return true
      } else {
        subscriptionStatus = response
        clearSessionData()

        const errorMessage = response.error || "Unknown error"

        // Handle specific device-related errors
        if (errorMessage.includes("Device limit reached")) {
          GM_notification({
            title: "🚫 Device Limit Reached",
            text: "Maximum number of devices exceeded. Please logout from other devices.",
            timeout: 8000,
          })
        } else if (errorMessage.includes("Session already active")) {
          GM_notification({
            title: "🚫 Already Active Elsewhere",
            text: "Your subscription is active on another device. Please logout there first.",
            timeout: 8000,
          })
        } else {
          GM_notification({
            title: "❌ Access Denied",
            text: errorMessage,
            timeout: 5000,
          })
        }

        return false
      }
    } catch (error) {
      console.error("❌ Subscription check failed:", error)

      GM_notification({
        title: "⚠️ Connection Error",
        text: "Could not verify subscription. Check your internet connection.",
        timeout: 5000,
      })

      return false
    }
  }

  // Start heartbeat to maintain session
  function startHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }

    heartbeatTimer = setInterval(async () => {
      console.log("💓 Heartbeat - Checking session...")
      const isValid = await checkSubscription()

      if (!isValid) {
        console.log("💔 Session lost - Stopping script")
        stopMainScript()
        showSubscriptionError()
      }
    }, CONFIG.HEARTBEAT_INTERVAL)
  }

  // Logout from current device
  async function logoutDevice() {
    if (!CONFIG.SESSION_TOKEN) {
      alert("No active session to logout from.")
      return
    }

    try {
      const deviceData = generateDeviceFingerprint()
      const deviceFingerprint = btoa(JSON.stringify(deviceData)).substring(0, 32)

      await makeApiRequest("/logout-device", "POST", {
        session_token: CONFIG.SESSION_TOKEN,
        device_fingerprint: deviceFingerprint,
      })

      clearSessionData()

      GM_notification({
        title: "🚪 Logged Out",
        text: "Successfully logged out from this device",
        timeout: 3000,
      })

      // Reload page to restart
      window.location.reload()
    } catch (error) {
      console.error("Logout error:", error)
      alert("Failed to logout. Please try again.")
    }
  }

  // Clear session data
  function clearSessionData() {
    CONFIG.SESSION_TOKEN = ""
    GM_setValue("session_token", "")
    subscriptionStatus = null

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  // Clear all stored data
  function clearAllData() {
    if (confirm("Are you sure you want to clear all stored data? You'll need to reconfigure everything.")) {
      GM_setValue("api_key", "")
      GM_setValue("subscription_code", "")
      GM_setValue("session_token", "")
      clearSessionData()

      GM_notification({
        title: "🗑️ Data Cleared",
        text: "All stored data has been cleared",
        timeout: 3000,
      })

      window.location.reload()
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
        timeout: 15000,
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
                max-width: 350px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            ">
                <h3 style="margin: 0 0 10px 0; color: #333;">🔐 Device Protection Active</h3>
                <p style="margin: 0 0 15px 0; font-size: 14px;">
                    This script uses device fingerprinting to prevent unauthorized sharing.
                    Please configure your credentials to continue.
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
        `Max Devices: ${sub.max_devices}\n\n` +
        `Features:\n${sub.features.map((f) => `• ${f}`).join("\n")}\n\n` +
        `Session: ${CONFIG.SESSION_TOKEN ? "Active" : "None"}`
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
                max-width: 450px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                text-align: center;
            ">
                <h2 style="margin: 0 0 15px 0; color: #d32f2f;">🚫 Access Denied</h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                    Device verification failed or subscription invalid.
                </p>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                    ${subscriptionStatus?.error || "Please check your subscription and device status."}
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="location.reload()" style="
                        background: #2196F3;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Retry</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Close</button>
                </div>
            </div>
        `

    document.body.appendChild(errorDiv)
  }

  // Main script functionality
  function startMainScript() {
    console.log("🚀 Starting device-protected script...")

    // Add visual indicator
    const indicator = document.createElement("div")
    indicator.innerHTML = "🔒 Protected Script Active"
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

    setTimeout(() => {
      if (document.body.contains(indicator)) {
        document.body.removeChild(indicator)
      }
    }, 5000)

    // Your main script functionality here
    addCustomFeatures()
  }

  function stopMainScript() {
    console.log("🛑 Stopping main script...")
    // Clean up any running features
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function addCustomFeatures() {
    // Add your protected features here
    const button = document.createElement("button")
    button.innerHTML = "🔒 Protected Feature"
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
      if (subscriptionStatus?.valid) {
        alert("🎉 Protected feature activated!\n\nThis feature is only available to verified subscribers.")
      } else {
        alert("❌ Feature unavailable - subscription not verified")
      }
    }

    document.body.appendChild(button)
  }

  // Handle page unload - cleanup session
  window.addEventListener("beforeunload", () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }
  })

  // Initialize when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
