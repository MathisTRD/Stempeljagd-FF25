// Firebase configuration and Firestore functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './env-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore functions
export async function loadStations() {
    try {
        const querySnapshot = await getDocs(collection(db, 'stations'));
        const stations = [];
        querySnapshot.forEach((doc) => {
            stations.push({ id: doc.id, ...doc.data() });
        });
        return stations;
    } catch (error) {
        console.error('Error loading stations:', error);
        return [];
    }
}

export async function addStation(station) {
    try {
        const docRef = await addDoc(collection(db, 'stations'), station);
        return { id: docRef.id, ...station };
    } catch (error) {
        console.error('Error adding station:', error);
        throw error;
    }
}

export async function updateStation(id, updates) {
    try {
        const stationRef = doc(db, 'stations', id);
        await updateDoc(stationRef, updates);
        return { id, ...updates };
    } catch (error) {
        console.error('Error updating station:', error);
        throw error;
    }
}

export async function deleteStation(id) {
    try {
        await deleteDoc(doc(db, 'stations', id));
        return { id };
    } catch (error) {
        console.error('Error deleting station:', error);
        throw error;
    }
}
