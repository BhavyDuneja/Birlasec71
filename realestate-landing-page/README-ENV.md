# Environment Configuration Guide

## Firebase Configuration

This project uses Firebase for data storage. The Firebase configuration is currently stored in:
- `webclone/www.birlassector71.com/birla-estate-sector71-gurugram/firebase-config.js`

### Current Firebase Config (Verified ✅)

```javascript
{
  apiKey: "AIzaSyClHvNT6jLUxs7ZwANuQ27VEfqMbCBf2_M",
  authDomain: "birlasec71-b4831.firebaseapp.com",
  projectId: "birlasec71-b4831",
  storageBucket: "birlasec71-b4831.firebasestorage.app",
  messagingSenderId: "824026476319",
  appId: "1:824026476319:web:3be39b714b957e0cc38a2a",
  measurementId: "G-0PN2CJXP4J"
}
```

### Config Structure Verification ✅

All required fields are present and correctly formatted:
- ✅ `apiKey`: Valid Firebase API key format
- ✅ `authDomain`: Correct format (projectId.firebaseapp.com)
- ✅ `projectId`: Matches authDomain
- ✅ `storageBucket`: Correct format (projectId.firebasestorage.app)
- ✅ `messagingSenderId`: Valid numeric ID
- ✅ `appId`: Valid format (senderId:platform:appId)
- ✅ `measurementId`: Valid Google Analytics ID format

## Important Notes

### Client-Side Configuration
Since this is a **client-side application** (runs in the browser), the Firebase config is exposed in the JavaScript files. This is normal and expected for Firebase web apps.

### Security
- Firebase API keys are **public** and safe to expose in client-side code
- Security is handled by Firebase Security Rules in Firestore
- Make sure your Firestore Security Rules are properly configured

### Environment Variables
For a client-side app, environment variables are typically not used because:
1. They would need to be bundled into the JavaScript at build time
2. The values would still be visible in the browser
3. Firebase config is meant to be public

If you need environment-specific configs (dev/staging/prod), you can:
1. Use different `firebase-config.js` files per environment
2. Use a build process to inject values
3. Use Firebase's multiple project setup

## Server Configuration

If you're running the Node.js server (`server.js`), you can use environment variables:

```bash
PORT=8001
NODE_ENV=development
```

These can be set in:
- `.env` file (requires `dotenv` package)
- System environment variables
- Command line: `PORT=8001 node server.js`

## Firestore Collections

The app uses these Firestore collections:
- `form_submissions` - Form submission data (name, phone, email, formType)
- `birla_sector71_visitors` - Visitor tracking data (session info only, no form data)

## Next Steps

1. ✅ Firebase config is correctly set
2. Verify Firestore Security Rules allow read/write access
3. Test form submissions to ensure data is being saved
4. Check Firebase Console to verify data is appearing

