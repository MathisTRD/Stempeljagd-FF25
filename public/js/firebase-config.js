import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeConfig } from "./config.js";

// Initialize Firebase with environment configuration
let app, db;

async function initializeFirebase() {
    if (!app) {
        const firebaseConfig = await initializeConfig();
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
    return { app, db };
}

export async function loadStations() {
    try {
        const { db } = await initializeFirebase();
        const querySnapshot = await getDocs(collection(db, "stations"));
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
        const { db } = await initializeFirebase();
        const docRef = await addDoc(collection(db, "stations"), station);
        return docRef.id;
    } catch (error) {
        console.error('Error adding station:', error);
        throw error;
    }
}

export async function updateStation(stationId, updatedData) {
    try {
        const { db } = await initializeFirebase();
        const stationRef = doc(db, "stations", stationId);
        await updateDoc(stationRef, updatedData);
        return true;
    } catch (error) {
        console.error('Error updating station:', error);
        throw error;
    }
}

export async function deleteStation(stationId) {
    try {
        const { db } = await initializeFirebase();
        await deleteDoc(doc(db, "stations", stationId));
        return true;
    } catch (error) {
        console.error('Error deleting station:', error);
        throw error;
    }
}
