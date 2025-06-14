# Tampermonkey Integration Guide

This guide explains how to integrate your Tampermonkey script with the subscription management system.

## 🚀 Quick Setup

### 1. Install the Script
1. Copy the `tampermonkey-subscription-checker.js` code
2. Open Tampermonkey dashboard
3. Create a new script and paste the code
4. Update the `@match` directives to target your desired websites
5. Replace `https://your-app-domain.vercel.app` with your actual API URL

### 2. Configure API Access
1. Get your API key from the admin panel (`/admin/clients`)
2. Get your subscription code from your subscription
3. Run the script and use the setup prompts to enter credentials

## 🔧 Configuration

### API Configuration
\`\`\`javascript
const CONFIG = {
    API_BASE_URL: 'https://your-app-domain.vercel.app/api/subscription',
    CHECK_INTERVAL: 24 * 60 * 60 * 1000, // Check every 24 hours
};
\`\`\`

### Website Targeting
Update the `@match` directives in the script header:
\`\`\`javascript
// @match        https://example.com/*
// @match        https://*.example.com/*
// @match        https://your-target-site.com/*
\`\`\`

## 🎯 Features

### Automatic Subscription Verification
- Checks subscription status on script startup
- Caches results for 24 hours to reduce API calls
- Graceful handling of network errors with 7-day grace period

### User Interface
- **Menu Commands**: Right-click Tampermonkey icon for options
- **Visual Indicators**: Shows subscription status
- **Notifications**: Desktop notifications for status changes
- **Error Handling**: Clear error messages for invalid subscriptions

### Security Features
- Secure credential storage using Tampermonkey's GM_setValue
- API key validation
- Subscription code verification
- Automatic cache invalidation on errors

## 📋 Menu Commands

| Command | Description |
|---------|-------------|
| ⚙️ Configure API Key | Set or update your API key |
| 🔑 Configure Subscription Code | Set or update subscription code |
| 🔄 Check Subscription Status | Force refresh subscription check |
| 📊 View Subscription Info | Display current subscription details |
| 🗑️ Clear Cache | Clear cached subscription data |

## 🔐 API Endpoints Used

### Subscription Verification
\`\`\`
POST /api/subscription/verify
Headers: X-API-Key: your-api-key
Body: { "subscription_code": "SUB_ABC123_DEF456" }
\`\`\`

### Subscription Status
\`\`\`
GET /api/subscription/status
Headers: X-API-Key: your-api-key
\`\`\`

## 🛠️ Customization

### Adding Your Functionality
Replace the example functions in the `startMainScript()` function:

\`\`\`javascript
function startMainScript() {
    console.log('🚀 Starting main script functionality...');
    
    // Your custom functionality here
    yourCustomFunction();
    addYourFeatures();
    setupYourEventListeners();
}
\`\`\`

### Error Handling
The script includes comprehensive error handling:
- Network connectivity issues
- Invalid API credentials
- Expired subscriptions
- Server errors

### Caching Strategy
- **Valid subscriptions**: Cached for 24 hours
- **Network errors**: 7-day grace period with cached data
- **Invalid subscriptions**: No caching, immediate blocking

## 🔍 Debugging

### Console Logging
The script provides detailed console logs:
\`\`\`javascript
console.log('🔐 Subscription Protected Script - Initializing...');
console.log('✅ Subscription verified - Starting main script...');
console.log('❌ Subscription invalid - Script blocked');
\`\`\`

### Testing Subscription Status
Use the menu command "🔄 Check Subscription Status" to test your setup.

## 📱 User Experience

### First-Time Setup
1. Script shows welcome message with setup buttons
2. User configures API key and subscription code
3. Automatic verification and script activation

### Daily Usage
1. Script runs automatically when visiting target sites
2. Cached subscription data for fast loading
3. Periodic background verification

### Subscription Issues
1. Clear error messages for expired/invalid subscriptions
2. Visual blocking of script functionality
3. Easy access to subscription information

## 🚨 Troubleshooting

### Common Issues

**"API key required" error**
- Ensure API key is configured via menu command
- Check that API key is valid in admin panel

**"Subscription not found" error**
- Verify subscription code is correct
- Check that subscription is active and not expired

**"Network error" messages**
- Check internet connection
- Verify API URL is correct and accessible
- Check if your domain is deployed and running

**Script not running**
- Verify `@match` directives include your target sites
- Check Tampermonkey is enabled for the site
- Look for JavaScript errors in browser console

### Support
For technical support, contact your subscription provider or check the admin panel for subscription details.
