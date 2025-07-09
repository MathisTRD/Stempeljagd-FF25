// Environment configuration loader for client-side applications
// This handles different deployment scenarios (Vercel, static hosting, etc.)

let firebaseConfig;

// Function to load environment variables from .env file (for development)
async function loadEnvFile() {
    try {
        const response = await fetch('/.env');
        if (!response.ok) return null;
        
        const text = await response.text();
        const env = {};
        
        text.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        
        return env;
    } catch (error) {
        console.warn('Could not load .env file:', error);
        return null;
    }
}

// Initialize configuration
async function initializeConfig() {
    // Try to load from environment variables (Vercel, Netlify, etc.)
    if (typeof window !== 'undefined' && window.ENV) {
        firebaseConfig = {
            apiKey: window.ENV.FIREBASE_API_KEY,
            authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
            projectId: window.ENV.FIREBASE_PROJECT_ID,
            storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID,
            appId: window.ENV.FIREBASE_APP_ID,
            measurementId: window.ENV.FIREBASE_MEASUREMENT_ID
        };
        return firebaseConfig;
    }

    // Try to load from .env file (development)
    const env = await loadEnvFile();
    if (env) {
        firebaseConfig = {
            apiKey: env.FIREBASE_API_KEY,
            authDomain: env.FIREBASE_AUTH_DOMAIN,
            projectId: env.FIREBASE_PROJECT_ID,
            storageBucket: env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
            appId: env.FIREBASE_APP_ID,
            measurementId: env.FIREBASE_MEASUREMENT_ID
        };
        return firebaseConfig;
    }

    // No config found
    throw new Error('No Firebase configuration found! Please set up environment variables or a .env file.');
}

export { initializeConfig, firebaseConfig };
