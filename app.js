// =====================================================
// APP.JS
// BRACKET PUBLIK
// PD AMPG BANTEN
// =====================================================

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


// =====================================================
// FIREBASE
// =====================================================

const app =
    initializeApp(firebaseConfig);

const db =
    getDatabase(app);

const tournamentRef =
    ref(db, "tournament");


// =====================================================
// KONFIGURASI
// =====================================================

const ROUNDS = {

    r1: 20,

    r2: 10,

    r3: 5,

    r4: 2,

    r5: 1

};


const ROUND_NAMES = {

    r1: "ROUND 1",

    r2: "ROUND 2",

    r3: "ROUND 3",

    r4: "SEMIFINAL",

    r5: "FINAL"

};


// =====================================================
// DEFAULT DATA
// =====================================================

function createMatches(count) {

    return Array.from(
        { length: count },
        () => ({

            sa: "",

            sb: "",

            winner: null

        })
    );

}


function defaultState() {

    return {

        title:
            "Turnamen PD AMPG Banten",

        teams:
            Array.from(
                { length: 20 },
                (_, i) =>
                    `PAIR ${i + 1}`
            ),

        matches: {

            r1: createMatches(20),

            r2: createMatches(10),

            r3: createMatches(5),

            r4: createMatches(2),

            r5: createMatches(1)

        },

        updatedAt: null

    };

}


// =====================================================
// NORMALIZE
// =====================================================

function normalizeData(data) {

    const state =
        data || defaultState();


    state.title =
        state.title ||
        "Turnamen PD AMPG Banten";


    state.teams =
        Array.from(
            { length: 20 },
            (_, i) =>
                state.teams?.[i] ||
                `PAIR ${i + 1}`
        );


    state.matches =
        state.matches || {};


    for (
        const [round, count]
        of Object.entries(ROUNDS)
    ) {

        state.matches[round] =
            Array.from(
                { length: count },
                (_, i) => {

                    const match =
                        state.matches?.[round]?.[i];


                    return {

                        sa:
                            match?.sa ?? "",

                        sb:
                            match?.sb ?? "",

                        winner:
                            match?.winner ?? null

                    };

                }
            );

    }


    return state;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

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

                "'": "&#39;"

            };

            return map[character];

        }
    );

}


// =====================================================
// NAMA PEMAIN / PAIR
// =====================================================

function getParticipant(
    state,
    round,
    matchIndex,
    side
) {

    // ---------------------------------------------
    // ROUND 1
    // ---------------------------------------------

    if (
        round === "r1"
    ) {

        const index =
            matchIndex * 2 +
            (
                side === "a"
                    ? 0
                    : 1
            );


        return (
            state.teams[index] ||
            "—"
        );

    }


    // ---------------------------------------------
    // ROUND BERIKUTNYA
    // ---------------------------------------------

    const previousRound = {

        r2: "r1",

        r3: "r2",

        r4: "r3",

        r5: "r4"

    }[round];


    const previousMatch =
        matchIndex * 2 +
        (
            side === "a"
                ? 0
                : 1
        );


    const previous =
        state.matches
            ?.[
                previousRound
            ]
            ?.[previousMatch];


    if (
        !previous ||
        !previous.winner
    ) {

        return "—";

    }


    return getParticipant(
        state,
        previousRound,
        previousMatch,
        previous.winner
    );

}


// =====================================================
// RENDER BRACKET
// =====================================================

function renderBracket(state) {

    const bracket =
        document.getElementById(
            "bracket"
        );


    if (!bracket) {

        console.error(
            "Element #bracket tidak ditemukan."
        );

        return;

    }


    let html = "";


    for (
        const [round, roundName]
        of Object.entries(ROUND_NAMES)
    ) {

        html += `

            <section
                class="round"
                data-round="${round}"
            >

                <div class="round-header">

                    <h3>
                        ${roundName}
                    </h3>

                    <span>
                        ${ROUNDS[round]} Match
                    </span>

                </div>

                <div class="matches">

        `;


        state.matches[round]
            .forEach(
                (match, index) => {

                    const teamA =
                        getParticipant(
                            state,
                            round,
                            index,
                            "a"
                        );


                    const teamB =
                        getParticipant(
                            state,
                            round,
                            index,
                            "b"
                        );


                    html += `

                        <article class="match">

                            <div class="match-number">
                                Match ${index + 1}
                            </div>


                            <div class="
                                team
                                ${
                                    match.winner === "a"
                                        ? "win"
                                        : ""
                                }
                            ">

                                <span
                                    class="
                                        team-name
                                        ${
                                            teamA === "—"
                                                ? "empty"
                                                : ""
                                        }
                                    "
                                >
                                    ${escapeHtml(teamA)}
                                </span>

                                <strong>
                                    ${escapeHtml(match.sa)}
                                </strong>

                            </div>


                            <div class="
                                team
                                ${
                                    match.winner === "b"
                                        ? "win"
                                        : ""
                                }
                            ">

                                <span
                                    class="
                                        team-name
                                        ${
                                            teamB === "—"
                                                ? "empty"
                                                : ""
                                        }
                                    "
                                >
                                    ${escapeHtml(teamB)}
                                </span>

                                <strong>
                                    ${escapeHtml(match.sb)}
                                </strong>

                            </div>

                        </article>

                    `;

                }
            );


        html += `

                </div>

            </section>

        `;

    }


    bracket.innerHTML =
        html;

}


// =====================================================
// UPDATE HEADER
// =====================================================

function updateHeader(state) {

    const title =
        document.getElementById(
            "title"
        );


    const updated =
        document.getElementById(
            "updated"
        );


    if (title) {

        title.textContent =
            state.title;

    }


    if (updated) {

        if (state.updatedAt) {

            updated.textContent =
                "Terakhir diperbarui: " +
                new Date(
                    state.updatedAt
                ).toLocaleString(
                    "id-ID"
                );

        } else {

            updated.textContent =
                "Belum ada pembaruan.";

        }

    }

}


// =====================================================
// STATUS
// =====================================================

function setStatus(
    online
) {

    const status =
        document.getElementById(
            "status"
        );


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


// =====================================================
// FIREBASE REALTIME
// =====================================================

onValue(

    tournamentRef,

    snapshot => {

        const state =
            normalizeData(
                snapshot.val()
            );


        updateHeader(state);

        renderBracket(state);

        setStatus(true);

    },

    error => {

        console.error(
            "Firebase error:",
            error
        );


        const state =
            defaultState();


        updateHeader(state);

        renderBracket(state);

        setStatus(false);

    }

);


// =====================================================
// INITIAL
// =====================================================

console.log(
    "✓ app.js — Public Bracket aktif."
);
