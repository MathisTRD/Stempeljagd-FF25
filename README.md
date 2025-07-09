# Stempeljagd FF25

A station management system for group activities.

## Features
- Real-time station tracking
- Group management
- Firebase Firestore integration
- Statistics and reporting

## Local Development

1. Clone the repository
2. Create a `.env` file with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:8000/main.html

## Deployment

### Vercel Deployment

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all the `VITE_FIREBASE_*` variables from your `.env` file

### Manual Static Hosting

The app can be deployed to any static hosting service:
- Upload all files except `.env`
- Make sure your Firebase configuration is properly set in `env-config.js`

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Create a collection called `stations` with documents containing:
   - `Stationsname` (string)
   - `Standort` (string) 
   - `Stationsnummer` (string)

4. Update Firestore security rules for testing:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## File Structure

- `main.html` - Main application page
- `script.js` - Application logic
- `style.css` - Styling
- `firebase-config.js` - Firebase integration
- `env-config.js` - Environment configuration
- `.env` - Environment variables (not in git)
- `vercel.json` - Vercel deployment configuration

## Author

Mathis
