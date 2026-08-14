// ============================================================
// APP.JS
// TURNAMEN PD AMPG BANTEN
// PUBLIC BRACKET - FIREBASE REALTIME DATABASE
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    firebaseConfig
} from "./firebase-config.js";


// ============================================================
// FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const tournamentRef = ref(
    db,
    "tournament"
);


// ============================================================
// KONFIGURASI ROUND
// ============================================================

const ROUND_CONFIG = {

    r1: {
        title: "ROUND 1",
        subtitle: "20 PAIR",
        matches: 20
    },

    r2: {
        title: "ROUND 2",
        subtitle: "10 PAIR",
        matches: 10
    },

    r3: {
        title: "ROUND 3",
        subtitle: "5 PAIR",
        matches: 5
    },

    r4: {
        title: "ROUND 4",
        subtitle: "SEMI FINAL",
        matches: 2
    },

    r5: {
        title: "ROUND 5",
        subtitle: "FINAL",
        matches: 1
    }

};


// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_DATA = {

    title: "TURNAMEN PD AMPG BANTEN",

    teams: Array.from(
        {
            length: 20
        },
        (_, index) => `PAIR ${index + 1}`
    ),

    matches: {

        r1: Array.from(
            {
                length: 20
            },
            () => ({
                sa: "",
                sb: "",
                winner: null
            })
        ),

        r2: Array.from(
            {
                length: 10
            },
            () => ({
                sa: "",
                sb: "",
                winner: null
            })
        ),

        r3: Array.from(
            {
                length: 5
            },
            () => ({
                sa: "",
                sb: "",
                winner: null
            })
        ),

        r4: Array.from(
            {
                length: 2
            },
            () => ({
                sa: "",
                sb: "",
                winner: null
            })
        ),

        r5: Array.from(
            {
                length: 1
            },
            () => ({
                sa: "",
                sb: "",
                winner: null
            })
        )

    },

    updatedAt: null

};


// ============================================================
// DATA GLOBAL
// ============================================================

let tournament = normalizeData(null);


// ============================================================
// NORMALIZE DATA
// ============================================================

function normalizeData(data) {

    const source = data || {};

    const result = {

        title:
            source.title ||
            DEFAULT_DATA.title,

        teams:
            [],

        matches:
            {},

        updatedAt:
            source.updatedAt || null

    };


    // --------------------------------------------------------
    // TEAMS
    // --------------------------------------------------------

    result.teams = Array.from(
        {
            length: 20
        },
        (_, index) => {

            return (
                source.teams?.[index] ||
                `PAIR ${index + 1}`
            );

        }
    );


    // --------------------------------------------------------
    // MATCHES
    // --------------------------------------------------------

    for (
        const [round, config]
        of Object.entries(ROUND_CONFIG)
    ) {

        result.matches[round] = Array.from(
            {
                length: config.matches
            },
            (_, index) => {

                const match =
                    source.matches?.[round]?.[index] ||
                    {};

                return {

                    sa:
                        match.sa ??
                        "",

                    sb:
                        match.sb ??
                        "",

                    winner:
                        match.winner ??
                        null

                };

            }
        );

    }


    return result;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const map = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            };

            return map[character];

        }
    );

}


// ============================================================
// GET ELEMENT
// ============================================================

function getElement(id) {

    return document.getElementById(id);

}


// ============================================================
// GET TEAM NAME ROUND 1
// ============================================================

function getRound1Team(
    matchIndex,
    side
) {

    const teamIndex =
        matchIndex * 2 +
        (side === "a" ? 0 : 1);


    return (
        tournament.teams?.[teamIndex] ||
        `PAIR ${teamIndex + 1}`
    );

}


// ============================================================
// GET WINNER FROM PREVIOUS ROUND
// ============================================================

function getWinner(
    round,
    matchIndex
) {

    const match =
        tournament.matches?.[round]?.[matchIndex];


    if (!match) {

        return null;

    }


    if (
        match.winner !== "a" &&
        match.winner !== "b"
    ) {

        return null;

    }


    const scoreA =
        match.sa ?? "";

    const scoreB =
        match.sb ?? "";


    // --------------------------------------------------------
    // Jika nama peserta berasal dari ronde sebelumnya
    // --------------------------------------------------------

    const participantA =
        getParticipant(
            round,
            matchIndex,
            "a"
        );

    const participantB =
        getParticipant(
            round,
            matchIndex,
            "b"
        );


    if (match.winner === "a") {

        return {

            name: participantA,

            score: scoreA

        };

    }


    return {

        name: participantB,

        score: scoreB

    };

}


// ============================================================
// GET PARTICIPANT
// ============================================================

function getParticipant(
    round,
    matchIndex,
    side
) {

    // --------------------------------------------------------
    // ROUND 1
    // --------------------------------------------------------

    if (round === "r1") {

        return getRound1Team(
            matchIndex,
            side
        );

    }


    // --------------------------------------------------------
    // ROUND 2
    // --------------------------------------------------------

    const previousRoundMap = {

        r2: "r1",
        r3: "r2",
        r4: "r3",
        r5: "r4"

    };


    const previousRound =
        previousRoundMap[round];


    if (!previousRound) {

        return "—";

    }


    const previousMatchIndex =
        matchIndex * 2 +
        (side === "a" ? 0 : 1);


    const winner =
        getWinner(
            previousRound,
            previousMatchIndex
        );


    if (!winner) {

        return "—";

    }


    return winner.name || "—";

}


// ============================================================
// GET CURRENT WINNER
// ============================================================

function isWinner(
    round,
    matchIndex,
    side
) {

    const match =
        tournament.matches?.[round]?.[matchIndex];


    if (!match) {

        return false;

    }


    return match.winner === side;

}


// ============================================================
// RENDER TITLE
// ============================================================

function renderTitle() {

    const titleElement =
        getElement("title");


    if (titleElement) {

        titleElement.textContent =
            tournament.title ||
            "TURNAMEN PD AMPG BANTEN";

    }


    const updatedElement =
        getElement("updated");


    if (!updatedElement) {

        return;

    }


    if (!tournament.updatedAt) {

        updatedElement.textContent =
            "Belum ada pembaruan.";

        return;

    }


    const date =
        new Date(
            tournament.updatedAt
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        updatedElement.textContent =
            "Belum ada pembaruan.";

        return;

    }


    updatedElement.textContent =
        "Terakhir diperbarui: " +
        date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}


// ============================================================
// RENDER STATUS
// ============================================================

function setLiveStatus(
    online = true
) {

    const status =
        getElement("status");


    if (!status) {

        return;

    }


    if (online) {

        status.textContent =
            "● LIVE";

        status.className =
            "status online";

    } else {

        status.textContent =
            "● OFFLINE";

        status.className =
            "status offline";

    }

}


// ============================================================
// RENDER MATCH
// ============================================================

function renderMatch(
    round,
    matchIndex
) {

    const match =
        tournament.matches?.[round]?.[matchIndex] ||
        {};


    const teamA =
        getParticipant(
            round,
            matchIndex,
            "a"
        );


    const teamB =
        getParticipant(
            round,
            matchIndex,
            "b"
        );


    const winnerA =
        isWinner(
            round,
            matchIndex,
            "a"
        );


    const winnerB =
        isWinner(
            round,
            matchIndex,
            "b"
        );


    const scoreA =
        match.sa ?? "";


    const scoreB =
        match.sb ?? "";


    const emptyA =
        teamA === "—";


    const emptyB =
        teamB === "—";


   return `
    <article
        class="match"
        id="match-${round}-${matchIndex}"
        data-round="${round}"
        data-match="${matchIndex}"
    >

            <div class="match-number">

                MATCH ${matchIndex + 1}

            </div>


            <div
                class="team ${winnerA ? "win" : ""}"
            >

                <span
                    class="team-name ${
                        emptyA
                            ? "empty"
                            : ""
                    }"
                >

                    ${escapeHTML(teamA)}

                </span>


                <strong>

                    ${escapeHTML(scoreA)}

                </strong>

            </div>


            <div
                class="team ${winnerB ? "win" : ""}"
            >

                <span
                    class="team-name ${
                        emptyB
                            ? "empty"
                            : ""
                    }"
                >

                    ${escapeHTML(teamB)}

                </span>


                <strong>

                    ${escapeHTML(scoreB)}

                </strong>

            </div>

        </article>

    `;

}


// ============================================================
// RENDER ROUND
// ============================================================

function renderRound(
    round
) {

    const config =
        ROUND_CONFIG[round];


    if (!config) {

        return "";

    }


    let matchesHTML = "";


    for (
        let index = 0;
        index < config.matches;
        index++
    ) {

        matchesHTML +=
            renderMatch(
                round,
                index
            );

    }


    return `

        <section
            class="round round-${round}"
        >

            <div class="round-header">

                <div class="round-title">

                    <h3>

                        ${config.title}

                    </h3>


                    <span class="round-subtitle">

                        ${config.subtitle}

                    </span>

                </div>

            </div>


            <div class="matches">

                ${matchesHTML}

            </div>

        </section>

    `;

}


// ============================================================
// RENDER BRACKET
// ============================================================

function renderBracket() {

    const bracket =
        getElement("bracket");


    if (!bracket) {

        console.error(
            "Element #bracket tidak ditemukan."
        );

        return;

    }


    bracket.innerHTML = `

        ${renderRound("r1")}

        ${renderRound("r2")}

        ${renderRound("r3")}

        ${renderRound("r4")}

        ${renderRound("r5")}

    `;

}


// ============================================================
// RENDER SEMUA
// ============================================================

function render() {

    renderTitle();

    renderBracket();

}


// ============================================================
// FIREBASE REALTIME LISTENER
// ============================================================

onValue(
    tournamentRef,
    snapshot => {

        try {

            const data =
                snapshot.val();


            tournament =
                normalizeData(
                    data
                );


            render();

            setLiveStatus(true);


            console.log(
                "Firebase data diterima:",
                tournament
            );

        } catch (error) {

            console.error(
                "Gagal membaca data Firebase:",
                error
            );

            setLiveStatus(false);

        }

    },

    error => {

        console.error(
            "Firebase Realtime Database error:",
            error
        );

        setLiveStatus(false);

    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

window.addEventListener(
    "error",
    event => {

        console.error(
            "Application Error:",
            event.error
        );

    }
);


// ============================================================
// INITIAL RENDER
// ============================================================

render();


// ============================================================
// DEBUG
// ============================================================

console.log(
    "======================================"
);

console.log(
    "PD AMPG BANTEN - PUBLIC BRACKET"
);

console.log(
    "Firebase Realtime Database aktif"
);

console.log(
    "======================================"
);
