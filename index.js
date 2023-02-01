/* Imports */
import TournamentOrganizer from "https://unpkg.com/tournament-organizer/dist/index.module.js";
import {
    Grid,
    html
} from "https://unpkg.com/gridjs?module";

/* Initial setup */
const TO = new TournamentOrganizer();
let tournament;

/* Check local storage on load */
(function () {
    const saved = window.localStorage.getItem('tournament');
    if (saved === null || saved === undefined) return;
    document.getElementById('continue').style.display = 'block';
})();

/* Event listeners */
document.getElementById('importBtn').addEventListener('change', importButton);
document.getElementById('exportBtn').addEventListener('click', exportButton);
document.getElementById('continueBtn').addEventListener('click', continueButton);
document.getElementById('setupBtn').addEventListener('click', setupButton);
document.getElementById('playersBtn').addEventListener('click', playersButton);
document.getElementById('pairingsBtn').addEventListener('click', pairingsButton);
document.getElementById('standingsBtn').addEventListener('click', standingsButton);
document.getElementById('createBtn').addEventListener('click', createButton);

/* Button functions */
function importButton() {
    const file = document.getElementById('importBtn').files[0];
    const reader = new FileReader();
    reader.onloadend = () => loadTournament(JSON.parse(reader.result));
    reader.readAsText(file);
}

function exportButton() {
    if (tournament === undefined) return;
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(tournament, null, 4))}`);
    element.setAttribute('download', `${tournament.name}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function continueButton() {
    loadTournament(JSON.parse(window.localStorage.getItem('tournament')));
}

function setupButton() {
    [...document.querySelectorAll('.main')].forEach(el => el.style.display = 'none');
    if (tournament !== undefined) {
        document.getElementById('tournamentName').value = tournament.name;
        document.getElementById('tournamentRoundCount').value = tournament.stageOne.rounds;
    }
    document.getElementById('setup').style.display = 'block';
}

function playersButton() {
    if (tournament === undefined) return;
    [...document.querySelectorAll('.main')].forEach(el => el.style.display = 'none');
    document.getElementById('players').style.display = 'block';
}

function pairingsButton() {
    if (tournament === undefined || tournament.status === 'setup') return;
    [...document.querySelectorAll('.main')].forEach(el => el.style.display = 'none');
    document.getElementById('pairings').style.display = 'block';
}

function standingsButton() {
    if (tournament === undefined || tournament.status === 'setup') return;
    [...document.querySelectorAll('.main')].forEach(el => el.style.display = 'none');
    document.getElementById('pairings').style.display = 'block';
}

function createButton() {
    const name = document.getElementById('tournamentName').value;
    if (name === undefined || name === null || name === '') return;
    const format = document.getElementById('tournamentFormat').value;
    const rounds = document.getElementById('tournamentRoundCount').value;
    tournament = TO.createTournament(name, {
        colored: true,
        sorting: 'descending',
        scoring: {
            tiebreaks: format === 'swiss' ? [
                'median buchholz',
                'solkoff',
                'cumulative',
                'versus'
            ] : [
                'sonneborn berger',
                'versus'
            ]
        },
        stageOne: {
            format: format,
            rounds: typeof rounds === 'number' && format === swiss ? rounds : 0
        }
    });
    save();
    document.getElementById('continue').style.display = 'none';
}

/* Utility functions */
function loadTournament(contents) {
    tournament = TO.reloadTournament(contents);
    save();
    document.getElementById('continue').style.display = 'none';
}

function save() {
    window.localStorage.setItem('tournament', JSON.stringify(tournament));
}