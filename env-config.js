// Environment configuration loader
// This file reads environment variables for different deployment scenarios

let firebaseConfig;

// Check if we're in a Vite environment (for development/build)
if (typeof import.meta !== 'undefined' && import.meta.env) {
    firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };
}
// Check if we're in Vercel environment
else if (typeof process !== 'undefined' && process.env) {
    firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
    };
}
// Fallback for direct file serving (like python -m http.server)
else {
    // For static hosting, we'll inject the config at build time
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
