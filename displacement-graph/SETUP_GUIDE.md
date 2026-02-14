# Google Authentication & Sheets Integration Setup Guide

## Overview
Your kinematics app now includes Google Sign-In and automatically saves quiz results to a Google Sheet with:
- Timestamp
- User's email address
- Score (e.g., 5/7)
- Individual answers with correct/incorrect indicators

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name/ID

### 2. Enable Required APIs

1. In Google Cloud Console, go to **APIs & Services > Library**
2. Search and enable:
   - **Google Sheets API**
   - **Google Identity Services**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in App name: "Kinematics Quiz"
   - Add your email as support email
   - Add authorized domains if needed (for production)
   - Add scopes: `email`, `profile`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Kinematics Web Client"
   - Authorized JavaScript origins: 
     - `http://localhost:8000`
     - Add your production domain if applicable
   - Authorized redirect URIs: (leave empty for now)
5. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### 4. Create API Key

1. In **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS** > **API key**
3. Copy the API key
4. (Optional but recommended) Click **Edit API key**:
   - Set Application restrictions to **HTTP referrers**
   - Add referrers: `http://localhost:8000/*` and your domain
   - Set API restrictions to **Google Sheets API**

### 5. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Kinematics Quiz Results"
4. In Sheet1, add headers in the first row:
   ```
   Timestamp | Email | Score | Score Fraction | Answers
   ```
5. Share the sheet:
   - Click **Share** button
   - Change to **Anyone with the link can view** OR
   - Add service account email (if using one)
6. Copy the Spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - Copy only the ID part

### 6. Update Your HTML File

Open `index.html` and replace these placeholders:

**Line ~144** - Replace OAuth Client ID:
```html
data-client_id="YOUR_CLIENT_ID_HERE"
```
with:
```html
data-client_id="123456789-abc.apps.googleusercontent.com"
```

**Line ~157** - Replace Spreadsheet ID:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```
with:
```javascript
const SPREADSHEET_ID = 'your-actual-spreadsheet-id-here';
```

**Line ~158** - Replace API Key:
```javascript
const API_KEY = 'YOUR_API_KEY_HERE';
```
with:
```javascript
const API_KEY = 'your-actual-api-key-here';
```

### 7. Test the Integration

1. Open your app in a browser: `http://localhost:8000/index.html`
2. Click **"Login with Google"** button
3. Sign in with your Google account
4. Complete the quiz
5. Check your Google Sheet - a new row should appear with your results!

## Troubleshooting

### "Access blocked" error during sign-in
- Make sure your OAuth consent screen is configured
- Add your email to test users if the app is not published
- Verify authorized origins include your current URL

### Results not saving to Sheet
- Check browser console for errors
- Verify the Spreadsheet ID is correct
- Ensure the Sheet is shared properly (public or with your account)
- Check that Google Sheets API is enabled
- Verify the sheet tab is named "Sheet1" or update the code accordingly

### CORS errors
- Make sure you're accessing via `http://localhost:8000` not `file://`
- Verify authorized origins in OAuth credentials

## Security Notes for Production

1. **API Key Restrictions**: Apply HTTP referrer restrictions to prevent unauthorized use
2. **OAuth Consent Screen**: Submit for verification for public use
3. **Sheet Permissions**: Consider using a service account for better control
4. **HTTPS**: Use HTTPS in production (required for credentials)
5. **Environment Variables**: Store credentials securely, not in code

## Data Stored

Each quiz completion saves:
- **Timestamp**: ISO 8601 format
- **Email**: User's Google email
- **Score**: Numerical score (0-7)
- **Score Fraction**: "X/7" format
- **Answers**: Pipe-separated list with ✓/✗ indicators

Example row:
```
2026-02-08T14:32:10.123Z | user@gmail.com | 6 | 6/7 | Q1: Accelerating away ✓ | Q2: 3.0 m/s ✓ | ...
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all credentials are correctly entered
3. Ensure APIs are enabled in Google Cloud Console
4. Check Google Sheet sharing permissions
