import { loadStations, addStation, updateStation, deleteStation } from './firebase-config.js';

let groups = [];

function createGroups(stationCount) {
    if (stationCount <= 0) {
        groups = [];
        return;
    }
    
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
}

function adjustGroupCount(newCount) {
    if (!Number.isInteger(newCount) || newCount < 1 || newCount > 20) {
        return false;
    }
    
    if (newCount < groups.length && groups.some(g => g.completedStations.length > 0)) {
        
    }
    
    const oldGroups = [...groups];
    groups = Array.from({ length: newCount }, (_, i) => ({
        name: `Gruppe ${i + 1}`,
        currentStation: null,
        nextStation: null,
        completedStations: [],
        skippedStations: [],
        failedStations: [],
        ...(oldGroups[i] ? {
            currentStation: oldGroups[i].currentStation,
            nextStation: oldGroups[i].nextStation,
            completedStations: [...oldGroups[i].completedStations],
            skippedStations: [...oldGroups[i].skippedStations],
            failedStations: [...oldGroups[i].failedStations]
        } : {})
    }));
    
    updateGroups();
    return true;
}

let stations = [];
let sortDirection = 'asc'; 
let currentFilter = 'station'; 
let statisticsSortDirection = 'desc'; 
let currentStatisticsFilter = 'completed';

const getVisitedStations = (group) => [
    ...group.completedStations,
    ...group.skippedStations,
    ...group.failedStations
];

const isGroupFinished = (group) => getVisitedStations(group).length >= stations.length;

const getOccupiedStations = () => new Set(
    groups
        .filter(group => !isGroupFinished(group))
        .flatMap(group => [group.currentStation, group.nextStation])
        .filter(Boolean)
);

function isStationOccupied(stationName, excludeGroup = null) {
    return groups.some(group => 
        group !== excludeGroup && 
        !isGroupFinished(group) && 
        group.currentStation === stationName
    );
}

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

function getNextStation(group) {
    if (isGroupFinished(group)) {
        return null;
    }
    
    const visitedByGroup = new Set(getVisitedStations(group));
    
    if (visitedByGroup.size >= stations.length) {
        return null;
    }
    
    const occupiedStations = getOccupiedStations();
    
    const availableStations = stations.filter(station => 
        !visitedByGroup.has(station.Stationsname) && 
        !occupiedStations.has(station.Stationsname)
    );
    
    if (availableStations.length === 0) {
        // Display message when no stations are available
        const container = document.getElementById('stations-table');
        if (container) {
            const noStationsMsg = document.createElement('div');
            noStationsMsg.className = 'no-stations-message';
            noStationsMsg.textContent = 'THERE ARE NO MORE STATIONS AVAILABLE';
            
            // Only add if not already present
            if (!container.querySelector('.no-stations-message')) {
                container.prepend(noStationsMsg);
            }
        }
        return null;
    }
    
    if (isGroupFinished(group)) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * availableStations.length);
    const selectedStation = availableStations[randomIndex].Stationsname;
    
    return selectedStation;
}

function assignStationsToGroups() {
    groups.forEach(group => {
        if (isGroupFinished(group)) {
            group.currentStation = null;
            group.nextStation = null;
            return;
        }
        
        if (!group.currentStation) {
            group.currentStation = getNextStation(group);
        }
        
        if (!group.nextStation && group.currentStation && !isGroupFinished(group)) {
            group.nextStation = getNextStation(group);
        }
        
        if (group.currentStation && !isGroupFinished(group) && isStationOccupied(group.currentStation, group)) {
            group.currentStation = getNextStation(group);
            if (group.currentStation && !isGroupFinished(group)) {
                group.nextStation = getNextStation(group);
            }
        }
    });
}

function processStation(group, actionType) {
    if (isGroupFinished(group)) {
        return false;
    }
    
    if (!group.currentStation) {
        return false;
    }
    
    const visitedStations = getVisitedStations(group);
    if (visitedStations.includes(group.currentStation)) {
        return false;
    }
    
    const currentStationName = group.currentStation;
    
    switch (actionType) {
        case 'completed':
            group.completedStations.push(currentStationName);
            break;
        case 'skipped':
            group.skippedStations.push(currentStationName);
            break;
        case 'failed':
            group.failedStations.push(currentStationName);
            break;
        default:
            return false;
    }
    
    if (isGroupFinished(group)) {
        group.currentStation = null;
        group.nextStation = null;
        updateGroups();
        return true;
    }
    
    group.currentStation = group.nextStation;
    group.nextStation = getNextStation(group);
    
    updateGroups();
    return true;
}

function updateStationsTable() {
    const container = document.getElementById('stations-table');
    if (!container) return;
    
    if (stations.length === 0) {
        container.innerHTML = '<div class="no-stations-message">THERE ARE NO MORE STATIONS AVAILABLE</div>';
        return;
    }
    
    const occupiedStations = getOccupiedStations();
    
    const sortedStations = [...stations].sort((a, b) => {
        if (currentFilter === 'station') {
            return sortDirection === 'asc' ? 
                a.Stationsname.localeCompare(b.Stationsname) : 
                b.Stationsname.localeCompare(a.Stationsname);
        }
        return 0;
    });
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Station</th>
                    <th>Status</th>
                    <th>Belegt von</th>
                </tr>
            </thead>
            <tbody>
                ${sortedStations.length > 0 ? 
                    sortedStations.map(station => {
                        const isOccupied = occupiedStations.has(station.Stationsname);
                        const occupyingGroup = groups.find(g => 
                            g.currentStation === station.Stationsname || 
                            g.nextStation === station.Stationsname
                        );
                        
                        return `
                            <tr class="${isOccupied ? 'occupied' : 'free'}">
                                <td>${station.Stationsname}</td>
                                <td>${isOccupied ? 'Belegt' : 'Frei'}</td>
                                <td>${occupyingGroup ? occupyingGroup.name : '-'}</td>
                            </tr>
                        `;
                    }).join('') : 
                    '<tr><td colspan="3" class="no-stations-message">THERE ARE NO MORE STATIONS AVAILABLE</td></tr>'
                }
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function updateStatisticsTable() {
    const container = document.getElementById('statistics-table');
    if (!container) return;
    
    if (groups.length === 0) {
        container.innerHTML = '<p>Keine Gruppen verfügbar</p>';
        return;
    }
    
    const sortedGroups = [...groups].sort((a, b) => {
        let comparison = 0;
        
        switch (currentStatisticsFilter) {
            case 'gruppe':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'completed':
                comparison = b.completedStations.length - a.completedStations.length;
                break;
            case 'skipped':
                comparison = b.skippedStations.length - a.skippedStations.length;
                break;
            case 'failed':
                comparison = b.failedStations.length - a.failedStations.length;
                break;
            case 'gesamt':
                const aTotal = getVisitedStations(a).length;
                const bTotal = getVisitedStations(b).length;
                comparison = bTotal - aTotal;
                break;
            case 'status':
                const aFinished = getVisitedStations(a).length >= stations.length;
                const bFinished = getVisitedStations(b).length >= stations.length;
                comparison = bFinished - aFinished;
                break;
            default:
                comparison = 0;
        }
        
        return statisticsSortDirection === 'desc' ? comparison : -comparison;
    });
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Gruppe</th>
                    <th onclick="setStatisticsFilter('completed')" style="cursor: pointer;">Erfolgreich</th>
                    <th onclick="setStatisticsFilter('skipped')" style="cursor: pointer;">Geskippt</th>
                    <th onclick="setStatisticsFilter('failed')" style="cursor: pointer;">Durchgefallen</th>
                    <th onclick="setStatisticsFilter('gesamt')" style="cursor: pointer;">Gesamt</th>
                    <th onclick="setStatisticsFilter('status')" style="cursor: pointer;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${sortedGroups.map(group => {
                    const visited = getVisitedStations(group).length;
                    const isFinished = visited >= stations.length && stations.length > 0;
                    
                    return `
                        <tr class="${isFinished ? 'finished' : 'active'}">
                            <td>${group.name}</td>
                            <td>${group.completedStations.length}</td>
                            <td>${group.skippedStations.length}</td>
                            <td>${group.failedStations.length}</td>
                            <td>${visited}/${stations.length}</td>
                            <td>${isFinished ? 'Fertig' : 'Aktiv'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function setFilter(filter) {
    if (currentFilter === filter) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentFilter = filter;
        sortDirection = 'asc';
    }
    updateStationsTable();
}

function setStatisticsFilter(filter) {
    if (currentStatisticsFilter === filter) {
        statisticsSortDirection = statisticsSortDirection === 'desc' ? 'asc' : 'desc';
    } else {
        currentStatisticsFilter = filter;
        statisticsSortDirection = 'desc';
    }
    updateStatisticsTable();
}

function handleGroupAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const groupIndex = parseInt(button.dataset.groupIndex);
    const action = button.dataset.action;
    const group = groups[groupIndex];
    
    if (!group) return;
    
    switch (action) {
        case 'finish':
            finishStation(group);
            break;
        case 'fail':
            failStation(group);
            break;
        case 'skip':
            skipStation(group);
            break;
    }
}

function createFinishedGroupHTML(group) {
    return `
        <h2>${group.name} </h2>
        <p><strong>ALLE STATIONEN ABGESCHLOSSEN!</strong></p>
        <div class="stats">
            <span class="stat-success">Erfolgreich: ${group.completedStations.length}</span>
            <span class="stat-skip">Geskippt: ${group.skippedStations.length}</span>
            <span class="stat-fail">Durchgefallen: ${group.failedStations.length}</span>
        </div>
    `;
}

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

function updateGroups() {
    const container = document.getElementById('groups-container');
    if (!container) {
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    groups.forEach((group, index) => {
        const isFinished = isGroupFinished(group);
        
        if (isFinished) {
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
    
    container.innerHTML = '';
    container.appendChild(fragment);
    
    container.removeEventListener('click', handleGroupAction);
    container.addEventListener('click', handleGroupAction);
    
    updateStationsTable();
    updateStatisticsTable();
}

const finishStation = (group) => processStation(group, 'completed');
const skipStation = (group) => processStation(group, 'skipped');
const failStation = (group) => processStation(group, 'failed');

async function initializeApp() {
    try {
        stations = await loadStations();
        createGroups(stations.length);
        assignStationsToGroups();
        updateGroups();
    } catch (error) {
        
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

window.createGroups = createGroups;
window.adjustGroupCount = adjustGroupCount;
window.setFilter = setFilter;
window.setStatisticsFilter = setStatisticsFilter;
window.groups = groups;
window.stations = stations;
window.debugGroups = () => {
    groups.forEach(group => {
        const visited = getVisitedStations(group).length;
        const isFinished = visited >= stations.length;
        
    });
};