// Handler für Gruppenanzahl-Änderung im Input-Feld
window.onGroupCountChange = function(value) {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count > 0 && count <= 99) {
        adjustGroupCount(count);
        assignStationsToGroups();
        updateGroups();
    }
}
// Load stations from assets/stationen.json
async function loadStations() {
    try {
        const response = await fetch('assets/stationen.json');
        if (!response.ok) throw new Error('Fehler beim Laden der Stationen');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Fehler beim Laden der Stationen:', error);
        return [];
    }
}

let groups = [];

function createGroups(stationCount) {
    if (stationCount <= 0) {
        groups = [];
        return;
    }
    const groupCount = Math.max(1, Math.ceil(stationCount * 0.8));
    groups = Array.from({ length: groupCount }, (_, i) => ({
        name: `Gruppe ${i + 1}`,
        currentStation: null,
        blacklist: [], // alle besuchten Stationen
        completedStations: [],
        skippedStations: [],
        failedStations: []
    }));
}

function adjustGroupCount(newCount) {
    if (!Number.isInteger(newCount) || newCount < 1 || newCount > 20) {
        return false;
    }
    const oldGroups = [...groups];
    groups = Array.from({ length: newCount }, (_, i) => ({
        name: `Gruppe ${i + 1}`,
        currentStation: oldGroups[i]?.currentStation || null,
        blacklist: oldGroups[i]?.blacklist ? [...oldGroups[i].blacklist] : [],
        completedStations: oldGroups[i]?.completedStations ? [...oldGroups[i].completedStations] : [],
        skippedStations: oldGroups[i]?.skippedStations ? [...oldGroups[i].skippedStations] : [],
        failedStations: oldGroups[i]?.failedStations ? [...oldGroups[i].failedStations] : []
    }));
    updateGroups();
    return true;
}

let stations = [];
let sortDirection = 'asc'; 
let currentFilter = 'station'; 
let statisticsSortDirection = 'desc'; 
let currentStatisticsFilter = 'completed';

const getVisitedStations = (group) => group.blacklist;

const isGroupFinished = (group) => getVisitedStations(group).length >= stations.length;

const getOccupiedStations = () => new Set(
    groups
        .filter(group => !isGroupFinished(group))
        .map(group => group.currentStation)
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
    if (isGroupFinished(group)) return null;
    const visited = new Set(group.blacklist);
    // 1. Versuche eine freie, noch nicht besuchte Station zu finden
    const occupied = getOccupiedStations();
    const freeStations = stations.filter(station =>
        !visited.has(station.Stationsname) && !occupied.has(station.Stationsname)
    );
    if (freeStations.length > 0) {
        const idx = Math.floor(Math.random() * freeStations.length);
        return freeStations[idx].Stationsname;
    }
    // 2. Wenn keine freie Station, dann eine noch nicht besuchte, auch wenn belegt
    const notYetVisited = stations.filter(station => !visited.has(station.Stationsname));
    if (notYetVisited.length > 0) {
        const idx = Math.floor(Math.random() * notYetVisited.length);
        return notYetVisited[idx].Stationsname;
    }
    // 3. Sonst fertig
    return null;
}

function assignStationsToGroups() {
    groups.forEach(group => {
        if (isGroupFinished(group)) {
            group.currentStation = null;
            return;
        }
        if (!group.currentStation) {
            group.currentStation = getNextStation(group);
        }
    });
}

function processStation(group, actionType) {
    if (isGroupFinished(group)) return false;
    if (!group.currentStation) return false;
    const currentStationName = group.currentStation;
    if (group.blacklist.includes(currentStationName)) return false;
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
    group.blacklist.push(currentStationName);
    group.currentStation = getNextStation(group);
    updateGroups();
    return true;
}

function updateStationsTable() {
    const container = document.getElementById('stations-table');
    if (!container) return;
    
    if (stations.length === 0) {
        container.innerHTML = '<div class="no-stations-message">No stations available</div>';
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
                    <th onclick="setFilter('station')" style="cursor: pointer;" title="Nach Station sortieren">Stationsname</th>
                    <th>Standort</th>
                    <th>Status</th>
                    <th>Belegt von</th>
                </tr>
            </thead>
            <tbody>
                ${sortedStations.length > 0 ? 
                    sortedStations.map(station => {
                        const isOccupied = occupiedStations.has(station.Stationsname);
                        // Finde alle Gruppen, die aktuell auf dieser Station sind
                        const occupyingGroups = groups.filter(g => g.currentStation === station.Stationsname);
                        const occupyingNames = occupyingGroups.map(g => g.name).join(', ');
                        return `
                            <tr class="${isOccupied ? 'occupied' : 'free'}">
                                <td>${station.Stationsname}</td>
                                <td>${station.Standort || '-'}</td>
                                <td class="${isOccupied ? 'status-occupied' : 'status-free'}">${isOccupied ? 'Belegt' : 'Frei'}</td>
                                <td>${occupyingNames || '-'}</td>
                            </tr>
                        `;
                    }).join('') : 
                    '<tr><td colspan="4" class="no-stations-message">Keine Stationen verfügbar</td></tr>'
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
    const total = group.completedStations.length + group.skippedStations.length + group.failedStations.length;
    return `
        <h2>${group.name}</h2>
        <p><strong>ALLE STATIONEN ABGESCHLOSSEN!</strong></p>
        <div class="finished-stats">
            <div class="stat-row">
                <span class="status-free">Erfolgreich: ${group.completedStations.length}</span>
            </div>
            <div class="stat-row">
                <span class="status-next">Geskippt: ${group.skippedStations.length}</span>
            </div>
            <div class="stat-row">
                <span class="status-occupied">Durchgefallen: ${group.failedStations.length}</span>
            </div>
            <div class="stat-row total">
                <strong>Gesamt: ${total} Stationen</strong>
            </div>
        </div>
    `;
}

function createActiveGroupHTML(group, groupIndex) {
    const currentStation = group.currentStation;
    return `
        <h2>${group.name}</h2>
        <div class="station-name">${currentStation || '-'}</div>
        <div class="group-stats">
            <p><span class="status-free">${group.completedStations.length}</span> | 
               <span class="status-next">${group.skippedStations.length}</span> | 
               <span class="status-occupied">${group.failedStations.length}</span></p>
        </div>
        <div class="action-buttons">
            <button class="btn-erfolgreich" data-group-index="${groupIndex}" data-action="finish" ${!group.currentStation ? 'disabled' : ''} title="${currentStation || 'Keine Station'} erfolgreich abschließen">
                Erfolgreich
            </button>
            <button class="btn-durchgefallen" data-group-index="${groupIndex}" data-action="fail" ${!group.currentStation ? 'disabled' : ''} title="${currentStation || 'Keine Station'} als durchgefallen markieren">
                Durchgefallen
            </button>
            <button class="btn-skip" data-group-index="${groupIndex}" data-action="skip" ${!group.currentStation ? 'disabled' : ''} title="${currentStation || 'Keine Station'} überspringen">
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
        createGroups(6);
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
        // ...existing code...
    });
};

// Dark Mode Toggle Functionality - Global functions
window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme icon
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = '';
    }
}

window.initializeTheme = function() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', defaultTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = '';
    }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeSectionVisibility();
});

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            const themeIcon = document.getElementById('theme-icon');
            if (themeIcon) {
                themeIcon.textContent = '';
            }
        }
    });
}

// Section Toggle Functionality
window.toggleSection = function(sectionName) {
    const content = document.getElementById(`${sectionName}-content`);
    const toggle = document.getElementById(`${sectionName}-toggle`);
    const toggleText = document.getElementById(`${sectionName}-toggle-text`);
    
    if (!content || !toggle || !toggleText) return;
    
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Show section
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
        toggleText.textContent = 'Ausblenden';
        localStorage.setItem(`${sectionName}-visible`, 'true');
    } else {
        // Hide section
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
        toggleText.textContent = 'Einblenden';
        localStorage.setItem(`${sectionName}-visible`, 'false');
    }
}

// Initialize section visibility from localStorage
function initializeSectionVisibility() {
    const sections = ['stations', 'statistics'];
    
    sections.forEach(sectionName => {
        const isVisible = localStorage.getItem(`${sectionName}-visible`);
        
        // Default to visible if no preference is saved
        if (isVisible === 'false') {
            const content = document.getElementById(`${sectionName}-content`);
            const toggle = document.getElementById(`${sectionName}-toggle`);
            const toggleText = document.getElementById(`${sectionName}-toggle-text`);
            
            if (content && toggle && toggleText) {
                content.classList.add('collapsed');
                toggle.classList.add('collapsed');
                toggleText.textContent = 'Einblenden';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeSectionVisibility);