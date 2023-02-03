/* Imports */
import TournamentOrganizer from "https://unpkg.com/tournament-organizer@3.2.4/dist/index.module.js";
import * as DataTable from "./DataTables/datatables.js";

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
document.getElementById('addPlayerBtn').addEventListener('click', addPlayerButton);
document.getElementById('removePlayerBtn').addEventListener('click', removePlayerButton);
document.getElementById('startTournamentBtn').addEventListener('click', startTournamentButton);

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
    playersTable.draw();
}

function pairingsButton() {
    if (tournament === undefined || tournament.status === 'setup') return;
    [...document.querySelectorAll('.main')].forEach(el => el.style.display = 'none');
    document.getElementById('pairings').style.display = 'block';
    pairingsTable.draw();
}

function standingsButton() {
    if (tournament === undefined || tournament.status === 'setup') return;
    [...document.querySelectorAll('.main')].forEach(el => el.style.display = 'none');
    document.getElementById('pairings').style.display = 'block';
}

function createButton() {
    if (tournament !== undefined) return;
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
    document.title = tournament.name;
}

function addPlayerButton() {
    if (tournament.status !== 'setup') return;
    const name = document.getElementById('playerName').value;
    if (name === undefined || name === null || name === '') return;
    const rating = document.getElementById('playerRating').value;
    document.getElementById('playerName').value = '';
    document.getElementById('playerRating').value = '';
    let player;
    try {
        player = tournament.createPlayer(name);
        player.values = {
            value: rating
        }
    } catch (e) {
        console.error(e);
        return;
    }
    save();
    updatePlayers();
}

function removePlayerButton() {
    if (tournament.status === 'complete') return;
    const id = document.getElementById('playerID').value;
    if (id === undefined || id === null || id === '') return;
    document.getElementById('playerID').value = '';
    try {
        tournament.removePlayer(id);
    } catch (e) {
        console.error(e);
        return;
    }
    save();
    updatePlayers();
}

function startTournamentButton() {
    try {
        tournament.start();
    } catch (e) {
        console.error(e);
        return;
    }
    save();
    updatePairings();
    // update standings
}

/* Tables */
const playersTable = $('#playersTable').DataTable({
    data: [],
    scrollY: '60vh',
    autoWidth: false,
    paging: false,
    dom: 'Bfrtip',
    buttons: [
        'print'
    ],
    columns: [
        {title: 'ID', data: 'id', width: '25%'},
        {title: 'Name', data: 'name', render: (d, t, r) => `${d} (${r.value})`, width: '55%'},
        {title: 'Active', data: 'active', width: '20%'}
    ]
});

const pairingsTable = $('#pairingsTable').DataTable({
    data: [],
    scrollY: '60vh',
    autoWidth: false,
    paging: false,
    dom: 'Bfrtip',
    buttons: [
        'print'
    ],
    columns: [
        {title: 'Board', data: 'match', width: '10%'},
        {title: 'White', data: 'player1.id', render: (d, t, r) => {
            if (d === null) return 'Bye';
            const player = tournament.players.find(p => p.id === d);
            return `${player.name} (${player.value})`
        }, width: '40%'},
        {title: 'Black', data: 'player2.id', render: (d, t, r) => {
            if (d === null) return 'Bye';
            const player = tournament.players.find(p => p.id === d);
            return `${player.name} (${player.value})`
        }, width: '40%'},
        {title: 'Result', data: 'active', render: (d, t, r) => d === true ? '0-0' : r.player1.draw === 1 && r.player2.draw === 1 ? '0.5-0.5' : `${r.player1.win}-${r.player2.win}`, width: '10%'}
    ]
});

const standingsTable = $('#standingsTable').DataTable({
    data: [],
    scrollY: '60vh',
    autoWidth: false,
    paging: false,
    dom: 'Bfrtip',
    buttons: [
        'print'
    ],
    columns: []//todo
})

/* Utility functions */
function loadTournament(contents) {
    tournament = TO.reloadTournament(contents);
    save();
    document.getElementById('continue').style.display = 'none';
    document.title = tournament.name;
    if (tournament.round > 1) {
        document.getElementById('roundNumber').value = tournament.round;
    }
    updatePlayers();
    updatePairings();
    // update standings
}

function save() {
    window.localStorage.setItem('tournament', JSON.stringify(tournament));
}

function updatePlayers() {
    playersTable.clear();
    playersTable.rows.add(tournament.players);
    playersTable.draw();
}

function updatePairings() {
    pairingsTable.clear();
    pairingsTable.rows.add(tournament.matches.filter(m => m.round === Number(document.getElementById('roundNumber').value)));
    pairingsTable.draw();
}