// Environment configuration loader
// This file reads environment variables for different deployment scenarios

let firebaseConfig;

// Check if we're in Vercel environment (server-side environment variables)
if (typeof process !== 'undefined' && process.env) {
    firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };
}
// Fallback for static hosting (like python -m http.server or direct file serving)
else {
    // For static hosting, we'll use the hardcoded config as fallback
    firebaseConfig = window.FIREBASE_CONFIG || {
        apiKey: "AIzaSyB8oHENYa0PRroiZFRQEFw0XiZELSgtA8o",
        authDomain: "stempeljagt-stationen.firebaseapp.com",
        projectId: "stempeljagt-stationen",
        storageBucket: "stempeljagt-stationen.firebasestorage.app",
        messagingSenderId: "228419296458",
        appId: "1:228419296458:web:61572a53046d5d60bd6833",
        measurementId: "G-M9C572QV94"
    };
}

export { firebaseConfig };
