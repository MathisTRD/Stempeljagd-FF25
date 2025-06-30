// Gruppen
import { loadStations, addStation, updateStation, deleteStation } from './firebase-config.js';

// Gruppen werden dynamisch erstellt basierend auf der Anzahl der Stationen
let groups = [];

// Erstellt Gruppen dynamisch basierend auf der Anzahl der Stationen
function createGroups(stationCount) {
    if (stationCount <= 0) {
        groups = [];
        console.log('Keine Stationen verfügbar - keine Gruppen erstellt');
        return;
    }
    
    // Optimal: etwa 80% der Stationenanzahl als Gruppenzahl, mindestens 1, maximal 12
    const optimalGroupCount = Math.max(1, Math.ceil(stationCount * 0.8));
    const groupCount = Math.min(optimalGroupCount, 12);
    
    groups = Array.from({ length: groupCount }, (_, i) => ({
        name: `Gruppe ${i + 1}`,
        currentStation: null,
        nextStation: null,
        completedStations: [],
        skippedStations: [],
        failedStations: []
    }));
    
    console.log(`${groupCount} Gruppen erstellt für ${stationCount} Stationen`);
}

// Optional: Gruppen manuell anpassen (kann in der Konsole aufgerufen werden)
function adjustGroupCount(newCount) {
    if (!Number.isInteger(newCount) || newCount < 1 || newCount > 20) {
        console.error('Gruppenanzahl muss eine ganze Zahl zwischen 1 und 20 sein');
        return false;
    }
    
    // Sicherheitsfrage bei drastischer Reduzierung
    if (newCount < groups.length && groups.some(g => g.completedStations.length > 0)) {
        console.warn(`Achtung: Reduzierung von ${groups.length} auf ${newCount} Gruppen. Fortschritt könnte verloren gehen.`);
    }
    
    const oldGroups = [...groups];
    groups = Array.from({ length: newCount }, (_, i) => ({
        name: `Gruppe ${i + 1}`,
        currentStation: null,
        nextStation: null,
        completedStations: [],
        skippedStations: [],
        failedStations: [],
        // Übertrage Daten von bestehenden Gruppen falls vorhanden
        ...(oldGroups[i] ? {
            currentStation: oldGroups[i].currentStation,
            nextStation: oldGroups[i].nextStation,
            completedStations: [...oldGroups[i].completedStations],
            skippedStations: [...oldGroups[i].skippedStations],
            failedStations: [...oldGroups[i].failedStations]
        } : {})
    }));
    
    updateGroups();
    console.log(`Gruppenanzahl erfolgreich auf ${newCount} angepasst`);
    return true;
}

// Debug-Utilities (können in der Konsole verwendet werden)
window.debugApp = {
    getGroups: () => groups,
    getStations: () => stations,
    showStats: () => {
        console.log('📊 App-Statistiken:');
        console.log(`Stationen: ${stations.length}`);
        console.log(`Gruppen: ${groups.length}`);
        console.log(`Fertige Gruppen: ${groups.filter(isGroupFinished).length}`);
        console.log(`Aktive Gruppen: ${groups.filter(g => !isGroupFinished(g)).length}`);
        console.log(`Belegte Stationen: ${getOccupiedStations().size}`);
    },
    resetAllGroups: () => {
        if (confirm('Alle Gruppendaten zurücksetzen?')) {
            createGroups(stations.length);
            updateGroups();
            console.log('✅ Alle Gruppen zurückgesetzt');
        }
    },
};

// Debug-Funktion
function debugGroupStatus() {
    console.log('=== DEBUG: Gruppen Status ===');
    groups.forEach((group, index) => {
        const visited = getVisitedStations(group);
        const isFinished = isGroupFinished(group);
        console.log(`${group.name}:`, {
            isFinished,
            visitedCount: visited.length,
            totalStations: stations.length,
            currentStation: group.currentStation,
            nextStation: group.nextStation,
            completed: group.completedStations.length,
            skipped: group.skippedStations.length,
            failed: group.failedStations.length
        });
    });
    console.log('Occupied stations:', Array.from(getOccupiedStations()));
    console.log('================================');
}

// Definiere die Stationen
let stations = [];
let sortDirection = 'asc'; 
let currentFilter = 'station'; 
let statisticsSortDirection = 'desc'; 
let currentStatisticsFilter = 'completed';

// Hilfsfunktionen für bessere Performance und Lesbarkeit
const getVisitedStations = (group) => [
    ...group.completedStations,
    ...group.skippedStations,
    ...group.failedStations
];

const isGroupFinished = (group) => getVisitedStations(group).length >= stations.length;

const getOccupiedStations = () => new Set(
    groups
        .filter(group => !isGroupFinished(group)) // Nur nicht-fertige Gruppen berücksichtigen
        .map(group => group.currentStation)
        .filter(Boolean)
);

// Prüft ob Station bereits von anderer Gruppe belegt ist
function isStationOccupied(stationName, excludeGroup = null) {
    return groups.some(group => 
        group !== excludeGroup && 
        group.currentStation === stationName
    );
}

// Validiert dass keine Station doppelt belegt ist
function validateStationAssignments() {
    const occupiedStations = new Set();
    const conflicts = [];
    
    for (const group of groups) {
        if (group.currentStation) {
            if (occupiedStations.has(group.currentStation)) {
                conflicts.push(group.currentStation);
            } else {
                occupiedStations.add(group.currentStation);
            }
        }
    }
    
    return conflicts;
}

// nächste Station finden (optimiert)
function getNextStation(group) {
    // Prüfe zuerst ob Gruppe bereits fertig ist
    if (isGroupFinished(group)) {
        return null;
    }
    
    const visitedByGroup = new Set(getVisitedStations(group));
    
    // Wenn alle Stationen besucht wurden, ist die Gruppe fertig
    if (visitedByGroup.size >= stations.length) {
        return null;
    }
    
    const occupiedStations = getOccupiedStations();
    
    // Finde verfügbare Stationen
    const availableStations = stations.filter(station => 
        !visitedByGroup.has(station.Stationsname) && 
        !occupiedStations.has(station.Stationsname)
    );
    
    if (availableStations.length === 0) {
        return null;
    }
    
    // Zufällige Auswahl für bessere Verteilung
    const randomIndex = Math.floor(Math.random() * availableStations.length);
    return availableStations[randomIndex].Stationsname;
}

// Allgemeine Funktion für Station-Aktionen (DRY-Prinzip)
function processStation(group, actionType) {
    if (!group.currentStation) {
        console.warn(`Keine aktuelle Station für ${group.name}`);
        return false;
    }
    
    // Prüfe ob Station bereits als besucht markiert ist
    const visitedStations = getVisitedStations(group);
    if (visitedStations.includes(group.currentStation)) {
        console.warn(`Station ${group.currentStation} bereits von ${group.name} besucht`);
        return false;
    }
    
    // Füge Station zur entsprechenden Liste hinzu
    switch (actionType) {
        case 'completed':
            group.completedStations.push(group.currentStation);
            break;
        case 'skipped':
            group.skippedStations.push(group.currentStation);
            break;
        case 'failed':
            group.failedStations.push(group.currentStation);
            break;
        default:
            console.error(`Unbekannter Aktionstyp: ${actionType}`);
            return false;
    }
    
    // Zur nächsten Station wechseln
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    
    // Prüfe ob Gruppe fertig ist
    if (isGroupFinished(group)) {
        group.currentStation = null;
        group.nextStation = null;
    }
    
    // Debug nach Aktion (optional - kann entfernt werden)
    // debugGroupStatus();
    
    updateGroups();
    return true;
}

// station erfolgreich
const finishStation = (group) => processStation(group, 'completed');

// station skippen  
const skipStation = (group) => processStation(group, 'skipped');

// station durchgefallen
const failStation = (group) => processStation(group, 'failed');

// Funktionen global verfügbar machen
window.setFilter = setFilter;
window.setStatisticsFilter = setStatisticsFilter;

// Erstelle HTML für fertige Gruppe
function createFinishedGroupHTML(group) {
    return `
        <h2>${group.name} ✅</h2>
        <p><strong>🎉 ALLE STATIONEN ABGESCHLOSSEN!</strong></p>
        <div class="stats">
            <span class="stat-success">Erfolgreich: ${group.completedStations.length}</span>
            <span class="stat-skip">Geskippt: ${group.skippedStations.length}</span>
            <span class="stat-fail">Durchgefallen: ${group.failedStations.length}</span>
        </div>
    `;
}

// Erstelle HTML für aktive Gruppe
function createActiveGroupHTML(group, groupIndex) {
    return `
        <h2>${group.name}</h2>
        <p><strong>Aktuelle Station:</strong> ${group.currentStation || '-'}</p>
        <p><strong>Nächste Station:</strong> ${group.nextStation || '-'}</p>
        <div class="action-buttons">
            <button class="btn-erfolgreich" data-group-index="${groupIndex}" data-action="finish" ${!group.currentStation ? 'disabled' : ''}>
                 Erfolgreich
            </button>
            <button class="btn-durchgefallen" data-group-index="${groupIndex}" data-action="fail" ${!group.currentStation ? 'disabled' : ''}>
                Durchgefallen
            </button>
            <button class="btn-skip" data-group-index="${groupIndex}" data-action="skip" ${!group.currentStation ? 'disabled' : ''}>
                Skip
            </button>
        </div>
    `;
}

// Event-Handler für Buttons
function handleGroupAction(event) {
    const { groupIndex, action } = event.target.dataset;
    const group = groups[parseInt(groupIndex)];
    
    if (!group) {
        console.error('Gruppe nicht gefunden:', groupIndex);
        return;
    }
    
    const actions = {
        finish: finishStation,
        fail: failStation,
        skip: skipStation
    };
    
    const actionFunction = actions[action];
    if (actionFunction) {
        actionFunction(group);
    } else {
        console.error('Unbekannte Aktion:', action);
    }
}

// gruppen updaten (optimiert)
function updateGroups() {
    // Debug-Logging entfernt für bessere Performance
    // console.log('🔄 updateGroups() aufgerufen');
    // debugGroupStatus();
    
    const container = document.getElementById('groups-container');
    if (!container) {
        console.error('Groups container nicht gefunden');
        return;
    }
    
    // Verwende DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
    groups.forEach((group, index) => {
        const isFinished = isGroupFinished(group);
        
        // Weise neue Stationen nur zu wenn Gruppe NICHT fertig ist
        if (!isFinished) {
            if (!group.currentStation) {
                group.currentStation = getNextStation(group);
            }
            if (!group.nextStation && group.currentStation) {
                group.nextStation = getNextStation(group);
            }
            
            // Löse Konflikte nur für nicht-fertige Gruppen
            if (group.currentStation && isStationOccupied(group.currentStation, group)) {
                group.currentStation = getNextStation(group);
                if (group.currentStation) {
                    group.nextStation = getNextStation(group);
                }
            }
        } else {
            // Fertige Gruppen komplett bereinigen
            group.currentStation = null;
            group.nextStation = null;
        }
        
        const groupDiv = document.createElement('div');
        groupDiv.className = `group ${isFinished ? 'finished' : ''}`;
        groupDiv.innerHTML = isFinished ? 
            createFinishedGroupHTML(group) : 
            createActiveGroupHTML(group, index);
        
        fragment.appendChild(groupDiv);
    });
    
    // Einmaliges DOM-Update
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Event-Delegation für bessere Performance
    container.removeEventListener('click', handleGroupAction);
    container.addEventListener('click', handleGroupAction);
    
    // Tabellen aktualisieren
    updateStationsTable();
    updateStatisticsTable();
}

// tabelle updaten (optimiert)
function updateStationsTable() {
    const tableBody = document.querySelector('#stations-table tbody');
    if (!tableBody) return;
    
    // Sortierung optimiert
    let sortedStations = [...stations];
    
    if (currentFilter === 'group') {
        const groupMap = new Map(groups.map(group => [group.currentStation, group.name]));
        sortedStations.sort((a, b) => {
            const groupA = groupMap.get(a.Stationsname);
            const groupB = groupMap.get(b.Stationsname);
            const nameA = groupA ? parseInt(groupA.split(' ')[1]) : Infinity;
            const nameB = groupB ? parseInt(groupB.split(' ')[1]) : Infinity;
            return nameA - nameB;
        });
    }
    
    if (sortDirection === 'desc') {
        sortedStations.reverse();
    }
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    const groupMap = new Map(groups.map(group => [group.currentStation, group.name]));
    
    sortedStations.forEach(station => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${station.Stationsnummer}</td>
            <td>${station.Stationsname}</td>
            <td>${station.Stationsstandort}</td>
            <td>${groupMap.get(station.Stationsname) || '/'}</td>
        `;
        fragment.appendChild(row);
    });
    
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
}

// filter setzen
function setFilter(filter) {
    if (currentFilter === filter) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortDirection = 'asc';
    }
    currentFilter = filter;
    updateSortIndicators();
    updateStationsTable();
}

// pfeile updaten (optimiert)
function updateSortIndicators() {
    const indicators = {
        station: document.getElementById('station-sort-indicator'),
        group: document.getElementById('group-sort-indicator')
    };
    
    Object.entries(indicators).forEach(([key, element]) => {
        if (element) {
            element.textContent = currentFilter === key ? 
                (sortDirection === 'asc' ? '▲' : '▼') : '↕';
        }
    });
}

// statistik tabelle (optimiert)
function updateStatisticsTable() {
    const tableBody = document.querySelector('#statistics-table tbody');
    if (!tableBody) return;
    
    // Sortierung mit Map für bessere Performance
    const sortFunctions = {
        completed: (a, b) => a.completedStations.length - b.completedStations.length,
        skipped: (a, b) => a.skippedStations.length - b.skippedStations.length,
        failed: (a, b) => a.failedStations.length - b.failedStations.length,
        total: (a, b) => getVisitedStations(a).length - getVisitedStations(b).length,
        name: (a, b) => {
            const nameA = parseInt(a.name.split(' ')[1]);
            const nameB = parseInt(b.name.split(' ')[1]);
            return nameA - nameB;
        }
    };
    
    let sortedGroups = [...groups];
    const sortFunction = sortFunctions[currentStatisticsFilter];
    
    if (sortFunction) {
        sortedGroups.sort(sortFunction);
        if (statisticsSortDirection === 'desc') {
            sortedGroups.reverse();
        }
    }
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
    sortedGroups.forEach(group => {
        const totalVisited = getVisitedStations(group).length;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${group.name}</td>
            <td class="stat-completed">${group.completedStations.length}</td>
            <td class="stat-skipped">${group.skippedStations.length}</td>
            <td class="stat-failed">${group.failedStations.length}</td>
            <td class="stat-total">${totalVisited}</td>
        `;
        fragment.appendChild(row);
    });
    
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
}

function setStatisticsFilter(filter) {
    if (currentStatisticsFilter === filter) {
        statisticsSortDirection = statisticsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        statisticsSortDirection = 'desc';
    }
    currentStatisticsFilter = filter;
    updateStatisticsSortIndicators();
    updateStatisticsTable();
}

// Statistik-Sortierung-Indikatoren (optimiert)
function updateStatisticsSortIndicators() {
    const indicatorIds = [
        'name-sort-indicator', 
        'completed-sort-indicator', 
        'skipped-sort-indicator', 
        'failed-sort-indicator', 
        'total-sort-indicator'
    ];
    
    indicatorIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const isActive = id === `${currentStatisticsFilter}-sort-indicator`;
            element.textContent = isActive ? 
                (statisticsSortDirection === 'asc' ? '▲' : '▼') : '↕';
        }
    });
}

// Initialisierung mit Error Handling und Performance-Optimierung
async function initializeApp() {
    try {
        console.log('Lade Stationen aus Firebase...');
        const data = await loadStations();
        stations = data || [];
        
        console.log(`📊 ${stations.length} Stationen geladen`);
        createGroups(stations.length);
        updateGroups();
        
        console.log('App erfolgreich initialisiert');
    } catch (error) {
        console.error('Fehler beim Laden der Stationen aus Firebase:', error);
        stations = [];
        createGroups(0);
        updateGroups();
    }
}

// App starten
initializeApp();

// Auto-Update mit reduzierter Frequenz für bessere Performance
setInterval(updateGroups, 10000); // Alle 10 Sekunden statt 5
