// ============================================================
// APP.JS
// TURNAMEN PD AMPG BANTEN
// PUBLIC BRACKET
// FIREBASE REALTIME
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

const app =
    initializeApp(
        firebaseConfig
    );


const db =
    getDatabase(
        app
    );


const tournamentRef =
    ref(
        db,
        "tournament"
    );


// ============================================================
// ROUND CONFIG
// ============================================================

const ROUND_CONFIG = {

    r1: {
        title: "ROUND 1",
        subtitle: "20 PAIR",
        matches: 10
    },

    r2: {
        title: "ROUND 2",
        subtitle: "10 PAIR",
        matches: 5
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

function createMatch() {

    return {

        sa: "",

        sb: "",

        winner: null

    };

}


function createDefaultData() {

    return {

        title:
            "TURNAMEN PD AMPG BANTEN",

        teams:
            Array.from(
                {
                    length: 20
                },
                (_, index) =>
                    `PAIR ${index + 1}`
            ),

        matches: {

            r1:
                Array.from(
                    {
                        length: 10
                    },
                    createMatch
                ),

            r2:
                Array.from(
                    {
                        length: 5
                    },
                    createMatch
                ),

            r3:
                Array.from(
                    {
                        length: 5
                    },
                    createMatch
                ),

            r4:
                Array.from(
                    {
                        length: 2
                    },
                    createMatch
                ),

            r5:
                Array.from(
                    {
                        length: 1
                    },
                    createMatch
                )

        },

        updatedAt:
            null

    };

}


// ============================================================
// GLOBAL DATA
// ============================================================

let tournament =
    createDefaultData();


// ============================================================
// NORMALIZE DATA
// ============================================================

function normalizeData(
    data
) {

    const source =
        data || {};


    const defaults =
        createDefaultData();


    const result = {

        title:
            source.title ||
            defaults.title,

        teams: [],

        matches: {},

        updatedAt:
            source.updatedAt ||
            null

    };


    // --------------------------------------------------------
    // HANYA 20 PAIR
    // --------------------------------------------------------

    result.teams =
        Array.from(
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
    // MATCH
    // --------------------------------------------------------

    for (
        const [
            round,
            config
        ]
        of Object.entries(
            ROUND_CONFIG
        )
    ) {

        result.matches[round] =
            Array.from(
                {
                    length:
                        config.matches
                },
                (_, index) => {

                    const old =
                        source
                            .matches
                            ?. [round]
                            ?. [index]
                        || {};


                    return {

                        sa:
                            old.sa ??
                            "",

                        sb:
                            old.sb ??
                            "",

                        winner:
                            old.winner ??
                            null

                    };

                }
            );

    }


    return result;

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const map = {

                "&":
                    "&amp;",

                "<":
                    "&lt;",

                ">":
                    "&gt;",

                '"':
                    "&quot;",

                "'":
                    "&#039;"

            };

            return map[
                character
            ];

        }
    );

}


// ============================================================
// GET ELEMENT
// ============================================================

function getElement(
    id
) {

    return document.getElementById(
        id
    );

}


// ============================================================
// ROUND 1
// PAIR 1 - PAIR 20
// ============================================================

function getRound1Team(
    matchIndex,
    side
) {

    const teamIndex =
        matchIndex * 2 +
        (
            side === "a"
                ? 0
                : 1
        );


    if (
        teamIndex < 0 ||
        teamIndex >= 20
    ) {

        return "—";

    }


    return (
        tournament.teams?.[
            teamIndex
        ] ||
        `PAIR ${teamIndex + 1}`
    );

}


// ============================================================
// GET PARTICIPANT ROUND 1
// ============================================================

function getParticipant(
    round,
    matchIndex,
    side
) {


    // ========================================================
    // ROUND 1
    // ========================================================

    if (
        round === "r1"
    ) {

        return getRound1Team(
            matchIndex,
            side
        );

    }


    // ========================================================
    // ROUND 2
    //
    // R1 M1 + M2 → R2 M1
    // R1 M3 + M4 → R2 M2
    // ========================================================

    if (
        round === "r2"
    ) {

        const sourceIndex =
            matchIndex * 2 +
            (
                side === "a"
                    ? 0
                    : 1
            );


        return getWinnerName(
            "r1",
            sourceIndex
        );

    }


    // ========================================================
    // ROUND 3
    //
    // Lima peserta dari ROUND 2
    //
    // R3 M1 = Winner R2 M1
    // R3 M2 = Winner R2 M2
    // R3 M3 = Winner R2 M3
    // R3 M4 = Winner R2 M4
    // R3 M5 = Winner R2 M5
    // ========================================================

    if (
        round === "r3"
    ) {

        const participant =
            getWinnerName(
                "r2",
                matchIndex
            );


        if (
            side === "a"
        ) {

            return participant;

        }


        return "—";

    }


    // ========================================================
    // SEMIFINAL
    //
    // SEMI 1
    // R3 M1 vs R3 M2
    //
    // SEMI 2
    // R3 M3 vs R3 M4
    // ========================================================

    if (
        round === "r4"
    ) {

        const sourceIndex =
            matchIndex * 2 +
            (
                side === "a"
                    ? 0
                    : 1
            );


        return getWinnerName(
            "r3",
            sourceIndex
        );

    }


    // ========================================================
    // FINAL
    //
    // Winner Semi 1
    // vs
    // Winner Semi 2
    // ========================================================

    if (
        round === "r5"
    ) {

        const sourceIndex =
            side === "a"
                ? 0
                : 1;


        return getWinnerName(
            "r4",
            sourceIndex
        );

    }


    return "—";

}


// ============================================================
// GET WINNER
// ============================================================

function getWinnerName(
    round,
    matchIndex
) {

    const match =
        tournament
            .matches
            ?. [round]
            ?. [matchIndex];


    if (
        !match
    ) {

        return "—";

    }


    if (
        match.winner !== "a" &&
        match.winner !== "b"
    ) {

        return "—";

    }


    // --------------------------------------------------------
    // ROUND 1
    // --------------------------------------------------------

    if (
        round === "r1"
    ) {

        return getRound1Team(
            matchIndex,
            match.winner
        );

    }


    // --------------------------------------------------------
    // ROUND 2
    // --------------------------------------------------------

    if (
        round === "r2"
    ) {

        const participant =
            getParticipant(
                "r2",
                matchIndex,
                match.winner
            );


        return participant;

    }


    // --------------------------------------------------------
    // ROUND 3
    //
    // Karena R3 adalah daftar 5 peserta,
    // gunakan peserta sisi A.
    // --------------------------------------------------------

    if (
        round === "r3"
    ) {

        return getParticipant(
            "r3",
            matchIndex,
            "a"
        );

    }


    // --------------------------------------------------------
    // ROUND 4
    // --------------------------------------------------------

    if (
        round === "r4"
    ) {

        return getParticipant(
            "r4",
            matchIndex,
            match.winner
        );

    }


    // --------------------------------------------------------
    // ROUND 5
    // --------------------------------------------------------

    if (
        round === "r5"
    ) {

        return getParticipant(
            "r5",
            matchIndex,
            match.winner
        );

    }


    return "—";

}


// ============================================================
// CHECK WINNER
// ============================================================

function isWinner(
    round,
    matchIndex,
    side
) {

    const match =
        tournament
            .matches
            ?. [round]
            ?. [matchIndex];


    if (
        !match
    ) {

        return false;

    }


    return (
        match.winner === side
    );

}


// ============================================================
// RENDER TITLE
// ============================================================

function renderTitle() {

    const title =
        getElement(
            "title"
        );


    if (
        title
    ) {

        title.textContent =
            tournament.title ||
            "TURNAMEN PD AMPG BANTEN";

    }


    const updated =
        getElement(
            "updated"
        );


    if (
        !updated
    ) {

        return;

    }


    if (
        !tournament.updatedAt
    ) {

        updated.textContent =
            "Terakhir diperbarui: belum ada pembaruan";

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

        updated.textContent =
            "Terakhir diperbarui: belum ada pembaruan";

        return;

    }


    updated.textContent =
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
// STATUS LIVE
// ============================================================

function setLiveStatus(
    online
) {

    const status =
        getElement(
            "status"
        );


    if (
        !status
    ) {

        return;

    }


    if (
        online
    ) {

        status.textContent =
            "● LIVE";

        status.className =
            "status online";

    }
    else {

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
    index
) {

    const match =
        tournament
            .matches
            ?. [round]
            ?. [index]
        || {};


    const teamA =
        getParticipant(
            round,
            index,
            "a"
        );


    const teamB =
        getParticipant(
            round,
            index,
            "b"
        );


    const winnerA =
        isWinner(
            round,
            index,
            "a"
        );


    const winnerB =
        isWinner(
            round,
            index,
            "b"
        );


    const scoreA =
        match.sa || "";


    const scoreB =
        match.sb || "";


    const emptyA =
        teamA === "—";


    const emptyB =
        teamB === "—";


    return `

        <article
            class="match"
            data-round="${round}"
            data-match="${index}"
        >

            <div class="match-number">

                MATCH ${index + 1}

            </div>


            <div
                class="
                    team
                    ${winnerA ? "win" : ""}
                "
            >

                <span
                    class="
                        team-name
                        ${emptyA ? "empty" : ""}
                    "
                >

                    ${escapeHTML(teamA)}

                </span>


                <strong>

                    ${escapeHTML(scoreA)}

                </strong>

            </div>


            <div
                class="
                    team
                    ${winnerB ? "win" : ""}
                "
            >

                <span
                    class="
                        team-name
                        ${emptyB ? "empty" : ""}
                    "
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
        ROUND_CONFIG[
            round
        ];


    let html = "";


    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    html += `

        <section
            class="
                round
                round-${round}
            "
        >

            <div class="round-header">

                <h3>
                    ${config.title}
                </h3>

                <span>
                    ${config.subtitle}
                </span>

            </div>


            <div class="matches">

    `;


    // --------------------------------------------------------
    // MATCHES
    // --------------------------------------------------------

    for (
        let i = 0;
        i < config.matches;
        i++
    ) {

        html +=
            renderMatch(
                round,
                i
            );

    }


    html += `

            </div>

        </section>

    `;


    return html;

}


// ============================================================
// RENDER BRACKET
// ============================================================

function renderBracket() {

    const bracket =
        getElement(
            "bracket"
        );


    if (
        !bracket
    ) {

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
// FIREBASE REALTIME
// ============================================================

onValue(
    tournamentRef,

    snapshot => {

        tournament =
            normalizeData(
                snapshot.val()
            );


        render();


        setLiveStatus(
            true
        );

    },

    error => {

        console.error(
            "Firebase error:",
            error
        );


        tournament =
            createDefaultData();


        render();


        setLiveStatus(
            false
        );

    }
);


// ============================================================
// WINDOW LOAD
// ============================================================

window.addEventListener(
    "load",
    () => {

        render();

    }
);


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        // Bracket menggunakan CSS Grid.
        // Tidak perlu redraw data.

    }
);
