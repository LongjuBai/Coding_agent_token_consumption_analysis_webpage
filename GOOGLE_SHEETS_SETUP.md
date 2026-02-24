# Google Sheets Setup Guide

This guide explains how to set up Google Sheets to save visitor guesses.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Token Guessing Game Data"
4. Add headers in row 1:
   - Problem ID
   - Guess Tokens
   - Guess Cost
   - Actual Avg Tokens
   - Actual Avg Cost
   - Timestamp

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete the default code and paste this:

```javascript
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Get data from the POST request
    const problemId = e.parameter.problemId || '';
    const guessTokens = e.parameter.guessTokens || '';
    const guessCost = e.parameter.guessCost || '';
    const actualAvgTokens = e.parameter.actualAvgTokens || '';
    const actualAvgCost = e.parameter.actualAvgCost || '';
    const timestamp = e.parameter.timestamp || new Date().toISOString();
    
    // Append row to sheet
    sheet.appendRow([
      problemId,
      guessTokens,
      guessCost,
      actualAvgTokens,
      actualAvgCost,
      timestamp
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const rows = values.slice(1).map((row) => ({
      problemId: row[0] || '',
      guessTokens: toNumber(row[1]),
      guessCost: toNumber(row[2]),
      actualAvgTokens: toNumber(row[3]),
      actualAvgCost: toNumber(row[4]),
      timestamp: row[5] || ''
    }));

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: rows
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Save** (💾) and give your project a name (e.g., "Save Guesses")

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Set:
   - **Description**: "Save guessing game data"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (so your website can access it)
4. Click **Deploy**
5. **Copy the Web App URL** that appears (looks like: `https://script.google.com/macros/s/.../exec`)

## Step 4: Update Your Website

1. Open `static/js/index.js`
2. Find the line: `const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';`
3. Replace it with your Web App URL from Step 3

## Step 5: Test

1. Visit your website
2. Make a guess in the guessing game
3. Check your Google Sheet - you should see the data appear
4. Open the main page on a different machine/browser and verify the leaderboard loads shared rows

## Alternative: Use Formspree (Even Easier!)

If you prefer not to use Google Sheets, you can use Formspree:

1. Go to [Formspree.io](https://formspree.io) and create a free account
2. Create a new form
3. Copy the form endpoint URL
4. Update the `saveGuessToGoogleSheets` function to use Formspree instead

## Troubleshooting

- **CORS errors**: Make sure you deployed the Apps Script as a Web App with "Anyone" access
- **No data appearing**: Check the browser console for errors
- **Permission denied**: Make sure the Apps Script deployment has "Anyone" access
