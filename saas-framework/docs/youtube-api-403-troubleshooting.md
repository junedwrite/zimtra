# Resolving the 403 "Forbidden" Error for YouTube Data API v3

You're seeing:

```
Forbidden – perhaps check your credentials?
YouTube Data API v3 has not been used in project 383740387263 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/youtube.googleapis.com/overview?project=383740387263 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.
```

This means your Google Cloud project either:

1. **Has not enabled the YouTube Data API v3**
2. **Has the API disabled**
3. **Is still propagating a recent enablement**

## Quick Steps to Fix

1. **Enable the YouTube Data API v3**
   - Go to the Google Cloud Console at
     `https://console.developers.google.com/apis/api/youtube.googleapis.com/overview?project=383740387263`
   - Click **Enable API**.

2. **Wait for Propagation**
   After clicking Enable, allow ~2–5 minutes for Google's systems to recognize the change.

3. **Verify Credentials**
   - Confirm that the API key or OAuth client you're supplying in your request belongs to project **383740387263**.
   - Ensure you're not using a different API key tied to another project.

4. **Check Quota & Restrictions**
   In the same console → **Credentials**, confirm that your API key:
   - Is unrestricted or specifically allowed for `youtube.googleapis.com`.
   - Has not been deleted or regenerated.

## Example cURL Request (once enabled)

```bash
curl \
  "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=YOUR_CHANNEL_ID&type=video&order=date&maxResults=50&key=YOUR_API_KEY"
```

- Replace **YOUR_API_KEY** with the key from project **383740387263**.
- If you still get 403, re-generate the key or switch to OAuth 2.0 credentials for private-data access.

## Additional Troubleshooting Steps

### Check API Key Configuration
1. Navigate to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials?project=383740387263)
2. Verify your API key is active and not restricted
3. Ensure the key has YouTube Data API v3 enabled

### Verify Project Settings
1. Confirm you're working with the correct project ID: **383740387263**
2. Check that billing is enabled for the project (required for API usage)
3. Verify the project has not exceeded quota limits

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| API key invalid | Regenerate the API key in Google Cloud Console |
| Wrong project | Ensure API key belongs to project 383740387263 |
| Quota exceeded | Check quota usage and request increase if needed |
| Recent enablement | Wait 5-10 minutes for propagation |

### Testing Your Setup

Once you've enabled the API and configured your credentials, test with this simple request:

```javascript
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${YOUR_API_KEY}`
);
const data = await response.json();
console.log(data);
```

If successful, you should receive a JSON response with video search results instead of a 403 error.