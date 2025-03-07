// Definiere die Gruppen mit ihren aktuellen und nächsten Stationen sowie abgeschlossenen Stationen
const groups = [
    { name: 'Gruppe 1', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 2', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 3', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 4', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 5', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 6', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 7', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 8', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 9', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 10', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 11', currentStation: null, nextStation: null, completedStations: [] },
    { name: 'Gruppe 12', currentStation: null, nextStation: null, completedStations: [] },
];

// Definiere die Stationen
let stations = [];
let sortDirection = 'asc'; // Sortierrichtung: 'asc' für aufsteigend, 'desc' für absteigend
let currentFilter = 'station'; // Standardfilter

// Lade die Stationen aus der JSON-Datei
fetch('StempeljagdAufgabensammlung.json')
    .then(response => response.json())
    .then(data => {
        stations = data;
        updateGroups();
    });

// Funktion, um die nächste Station für eine Gruppe zu finden
function getNextStation(group) {
    const availableStations = stations.filter(station => 
        !group.completedStations.includes(station.Stationsname) && 
        !groups.some(g => g.currentStation === station.Stationsname)
    );
    return availableStations[Math.floor(Math.random() * availableStations.length)].Stationsname;
}

// Funktion, um eine Station als abgeschlossen zu markieren
function finishStation(group) {
    group.completedStations.push(group.currentStation);
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    updateGroups();
}

// Funktion, um eine Station zu überspringen
function skipStation(group) {
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    updateGroups();
}

// Funktion, um die Gruppen und ihre Stationen zu aktualisieren
function updateGroups() {
    const container = document.getElementById('groups-container');
    container.innerHTML = '';
    groups.forEach(group => {
        if (!group.currentStation) {
            group.currentStation = getNextStation(group);
            group.nextStation = getNextStation(group);
        }
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.innerHTML = `
            <h2>${group.name}</h2>
            <p>Current Station: ${group.currentStation}</p>
            <p>Next Station: ${group.nextStation}</p>
            <button class="btn-erfolgreich" onclick="finishStation(groups[${groups.indexOf(group)}])">Erfolgreich</button>
            <button class="btn-durchgefallen" onclick="skipStation(groups[${groups.indexOf(group)}])">Durchgefallen</button>
            <button onclick="skipStation(groups[${groups.indexOf(group)}])">Skip</button>
        `;
        container.appendChild(groupDiv);
    });
    updateStationsTable();
}

// Funktion, um die Tabelle der Stationen und Gruppen zu aktualisieren
function updateStationsTable() {
    const tableBody = document.querySelector('#stations-table tbody');
    tableBody.innerHTML = '';
    let sortedStations = stations.slice();
    if (currentFilter === 'group') {
        sortedStations = sortedStations.sort((a, b) => {
            const groupA = groups.find(group => group.currentStation === a.Stationsname);
            const groupB = groups.find(group => group.currentStation === b.Stationsname);
            const groupAName = groupA ? parseInt(groupA.name.split(' ')[1]) : Infinity;
            const groupBName = groupB ? parseInt(groupB.name.split(' ')[1]) : Infinity;
            return groupAName - groupBName;
        });
    }
    if (sortDirection === 'desc') {
        sortedStations.reverse();
    }
    sortedStations.forEach(station => {
        const groupAtStation = groups.find(group => group.currentStation === station.Stationsname);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${station.Stationsnummer}</td>
            <td>${station.Stationsname}</td>
            <td>${station.Stationsstandort}</td>
            <td>${groupAtStation ? groupAtStation.name : '/'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Funktion, um den Filter zu setzen und die Tabelle zu aktualisieren
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

// Funktion, um die Sortierindikatoren zu aktualisieren
function updateSortIndicators() {
    const stationSortIndicator = document.getElementById('station-sort-indicator');
    const groupSortIndicator = document.getElementById('group-sort-indicator');
    if (currentFilter === 'station') {
        stationSortIndicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
        groupSortIndicator.textContent = '';
    } else {
        stationSortIndicator.textContent = '';
        groupSortIndicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
    }
}

// Initialisiere die Gruppen und aktualisiere sie alle 5 Sekunden
updateGroups();
setInterval(updateGroups, 5000);
