// Gruppen
const groups = [
    { name: 'Gruppe 1', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 2', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 3', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 4', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 5', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 6', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 7', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 8', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 9', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 10', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 11', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
    { name: 'Gruppe 12', currentStation: null, nextStation: null, completedStations: [], skippedStations: [], failedStations: [] },
];

// Definiere die Stationen
let stations = [];
let sortDirection = 'asc'; 
let currentFilter = 'station'; 
let statisticsSortDirection = 'desc'; 
let currentStatisticsFilter = 'completed';

// Lade die Stationen aus der JSON-Datei
fetch('StempeljagdAufgabensammlung.json')
    .then(response => response.json())
    .then(data => {
        stations = data;
        updateGroups();
    });

// nächste Station finden
function getNextStation(group) {
    const allCompletedStations = [...group.completedStations, ...group.skippedStations, ...group.failedStations];
    const availableStations = stations.filter(station => 
        !allCompletedStations.includes(station.Stationsname) && 
        !groups.some(g => g.currentStation === station.Stationsname)
    );
    return availableStations.length > 0 ? availableStations[Math.floor(Math.random() * availableStations.length)].Stationsname : null;
}

// station erfolgreich
function finishStation(group) {
    group.completedStations.push(group.currentStation);
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    updateGroups();
}

// station skippen
function skipStation(group) {
    group.skippedStations.push(group.currentStation);
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    updateGroups();
}

// station durchgefallen
function failStation(group) {
    group.failedStations.push(group.currentStation);
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    updateGroups();
}

// gruppen updaten
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
            <p>Aktuelle Station: ${group.currentStation}</p>
            <p>Nächste Station: ${group.nextStation}</p>
            <button class="btn-erfolgreich" onclick="finishStation(groups[${groups.indexOf(group)}])">Erfolgreich</button>
            <button class="btn-durchgefallen" onclick="failStation(groups[${groups.indexOf(group)}])">Durchgefallen</button>
            <button onclick="skipStation(groups[${groups.indexOf(group)}])">Skip</button>
        `;
        container.appendChild(groupDiv);
    });
    updateStationsTable();
    updateStatisticsTable();
}

// tabelle updaten
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

// pfeile updaten
function updateSortIndicators() {
    const stationSortIndicator = document.getElementById('station-sort-indicator');
    const groupSortIndicator = document.getElementById('group-sort-indicator');
    if (currentFilter === 'station') {
        stationSortIndicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
        groupSortIndicator.textContent = '↕';
    } else {
        stationSortIndicator.textContent = '↕';
        groupSortIndicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
    }
}

// statistik tabelle
function updateStatisticsTable() {
    const tableBody = document.querySelector('#statistics-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // sortieren
    let sortedGroups = groups.slice();
    switch (currentStatisticsFilter) {
        case 'completed':
            sortedGroups.sort((a, b) => a.completedStations.length - b.completedStations.length);
            break;
        case 'skipped':
            sortedGroups.sort((a, b) => a.skippedStations.length - b.skippedStations.length);
            break;
        case 'failed':
            sortedGroups.sort((a, b) => a.failedStations.length - b.failedStations.length);
            break;
        case 'total':
            sortedGroups.sort((a, b) => {
                const totalA = a.completedStations.length + a.skippedStations.length + a.failedStations.length;
                const totalB = b.completedStations.length + b.skippedStations.length + b.failedStations.length;
                return totalA - totalB;
            });
            break;
        case 'name':
            sortedGroups.sort((a, b) => {
                const nameA = parseInt(a.name.split(' ')[1]);
                const nameB = parseInt(b.name.split(' ')[1]);
                return nameA - nameB;
            });
            break;
    }
    
    if (statisticsSortDirection === 'desc') {
        sortedGroups.reverse();
    }
    
    sortedGroups.forEach(group => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${group.name}</td>
            <td>${group.completedStations.length}</td>
            <td>${group.skippedStations.length}</td>
            <td>${group.failedStations.length}</td>
            <td>${group.completedStations.length + group.skippedStations.length + group.failedStations.length}</td>
        `;
        tableBody.appendChild(row);
    });
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

function updateStatisticsSortIndicators() {
    const indicators = ['name-sort-indicator', 'completed-sort-indicator', 'skipped-sort-indicator', 'failed-sort-indicator', 'total-sort-indicator'];
    
    indicators.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === `${currentStatisticsFilter}-sort-indicator`) {
                element.textContent = statisticsSortDirection === 'asc' ? '▲' : '▼';
            } else {
                element.textContent = '↕';
            }
        }
    });
}

// start
updateGroups();
setInterval(updateGroups, 5000);
