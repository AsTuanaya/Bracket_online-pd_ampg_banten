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

    r4: "ROUND 4",

    r5: "ROUND 5"

};


// =====================================================
// DEFAULT MATCH
// =====================================================

function createMatch() {

    return {

        teamA: "",

        teamB: "",

        sa: "",

        sb: "",

        winner: null

    };

}


// =====================================================
// DEFAULT MATCHES
// =====================================================

function createMatches(count) {

    return Array.from(
        { length: count },
        () => createMatch()
    );

}


// =====================================================
// DEFAULT STATE
// =====================================================

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

            r1:
                createMatches(20),

            r2:
                createMatches(10),

            r3:
                createMatches(5),

            r4:
                createMatches(2),

            r5:
                createMatches(1)

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

                    const old =
                        state.matches
                            ?.[round]
                            ?.[i];


                    return {

                        teamA:
                            old?.teamA ?? "",

                        teamB:
                            old?.teamB ?? "",

                        sa:
                            old?.sa ?? "",

                        sb:
                            old?.sb ?? "",

                        winner:
                            old?.winner ?? null

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
        char => {

            const map = {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            };

            return map[char];

        }
    );

}


// =====================================================
// PARTICIPANT OTOMATIS
// =====================================================

function getAutomaticParticipant(
    state,
    round,
    matchIndex,
    side
) {

    // =============================================
    // ROUND 1
    // =============================================

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
            `PAIR ${index + 1}`
        );

    }


    // =============================================
    // PREVIOUS ROUND
    // =============================================

    const previousRound = {

        r2: "r1",

        r3: "r2",

        r4: "r3",

        r5: "r4"

    }[round];


    if (!previousRound) {

        return "—";

    }


    const previousMatchIndex =
        matchIndex * 2 +
        (
            side === "a"
                ? 0
                : 1
        );


    const previousMatch =
        state.matches
            ?.[
                previousRound
            ]
            ?.[previousMatchIndex];


    if (
        !previousMatch ||
        !previousMatch.winner
    ) {

        return "—";

    }


    return getParticipant(
        state,
        previousRound,
        previousMatchIndex,
        previousMatch.winner
    );

}


// =====================================================
// PARTICIPANT FINAL
//
// Manual teamA/teamB lebih utama.
// Jika kosong → otomatis.
// =====================================================

function getParticipant(
    state,
    round,
    matchIndex,
    side
) {

    const match =
        state.matches
            ?.[
                round
            ]
            ?.[matchIndex];


    // =============================================
    // MANUAL
    // =============================================

    if (match) {

        if (
            side === "a" &&
            match.teamA?.trim()
        ) {

            return match.teamA.trim();

        }


        if (
            side === "b" &&
            match.teamB?.trim()
        ) {

            return match.teamB.trim();

        }

    }


    // =============================================
    // OTOMATIS
    // =============================================

    return getAutomaticParticipant(
        state,
        round,
        matchIndex,
        side
    );

}


// =====================================================
// RENDER HEADER
// =====================================================

function renderHeader(state) {

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


                    const winnerA =
                        match.winner === "a";


                    const winnerB =
                        match.winner === "b";


                    html += `

                        <article
                            class="match"
                        >

                            <div
                                class="match-number"
                            >
                                Match ${index + 1}
                            </div>


                            <!-- =================================
                                 TEAM A
                            ================================== -->

                            <div
                                class="
                                    team
                                    ${winnerA ? "win" : ""}
                                "
                            >

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


                            <!-- =================================
                                 TEAM B
                            ================================== -->

                            <div
                                class="
                                    team
                                    ${winnerB ? "win" : ""}
                                "
                            >

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
// LIVE STATUS
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
// RENDER SEMUA
// =====================================================

function render(state) {

    renderHeader(state);

    renderBracket(state);

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


        render(state);

        setStatus(true);


        console.log(
            "✓ Data bracket diperbarui."
        );

    },

    error => {

        console.error(
            "FIREBASE DATABASE ERROR:",
            error
        );


        const state =
            defaultState();


        render(state);

        setStatus(false);

    }

);


// =====================================================
// START
// =====================================================

console.log(
    "✓ app.js — Bracket Publik LIVE aktif."
);
