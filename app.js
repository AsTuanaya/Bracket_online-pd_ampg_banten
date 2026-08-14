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

    // 20 PAIR = 10 pertandingan
    r1: {
        title: "ROUND 1",
        subtitle: "20 PAIR",
        matches: 10
    },

    // 10 pemenang = 5 pertandingan
    r2: {
        title: "ROUND 2",
        subtitle: "10 PAIR",
        matches: 5
    },

    // 5 pemenang
    r3: {
        title: "ROUND 3",
        subtitle: "5 PAIR",
        matches: 5
    },

    // SEMI FINAL
    r4: {
        title: "ROUND 4",
        subtitle: "SEMI FINAL",
        matches: 2
    },

    // FINAL
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
            length: 10
        },
        () => ({
            sa: "",
            sb: "",
            winner: null
        })
    ),

    r2: Array.from(
        {
            length: 5
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

}

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


    if (teamIndex >= 20) {

        return "—";

    }


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
// DRAW BRACKET CONNECTOR
// ============================================================

function drawBracketLines() {

    const wrapper =
        document.getElementById(
            "bracket-wrapper"
        );

    const svg =
        document.getElementById(
            "bracket-lines"
        );


    if (!wrapper || !svg) {

        return;

    }


    // --------------------------------------------------------
    // Bersihkan garis lama
    // --------------------------------------------------------

    svg.innerHTML = "";


    // --------------------------------------------------------
    // Ukuran wrapper
    // --------------------------------------------------------

    const wrapperRect =
        wrapper.getBoundingClientRect();


    const width =
        wrapper.scrollWidth;


    const height =
        wrapper.scrollHeight;


    svg.setAttribute(
        "width",
        width
    );

    svg.setAttribute(
        "height",
        height
    );

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );


    // --------------------------------------------------------
    // Hubungkan setiap ronde
    // --------------------------------------------------------

    const roundPairs = [

        ["r1", "r2"],

        ["r2", "r3"],

        ["r3", "r4"],

        ["r4", "r5"]

    ];


    roundPairs.forEach(
        ([fromRound, toRound]) => {

            const fromCount =
                getRoundMatchCount(
                    fromRound
                );

            const toCount =
                getRoundMatchCount(
                    toRound
                );


            for (
                let targetIndex = 0;
                targetIndex < toCount;
                targetIndex++
            ) {

                const sourceA =
                    targetIndex * 2;

                const sourceB =
                    targetIndex * 2 + 1;


                if (
                    sourceA >= fromCount ||
                    sourceB >= fromCount
                ) {

                    continue;

                }


                connectMatches(
                    fromRound,
                    sourceA,
                    fromRound,
                    sourceB,
                    toRound,
                    targetIndex,
                    wrapperRect,
                    svg
                );

            }

        }
    );

}


// ============================================================
// GET MATCH COUNT
// ============================================================

function getRoundMatchCount(
    round
) {

    return (
        ROUND_CONFIG[round]?.matches ||
        0
    );

}


// ============================================================
// CONNECT TWO MATCHES TO ONE MATCH
// ============================================================

function connectMatches(
    fromRound,
    sourceAIndex,
    fromRoundB,
    sourceBIndex,
    toRound,
    targetIndex,
    wrapperRect,
    svg
) {

    const sourceA =
        document.getElementById(
            `match-${fromRound}-${sourceAIndex}`
        );


    const sourceB =
        document.getElementById(
            `match-${fromRoundB}-${sourceBIndex}`
        );


    const target =
        document.getElementById(
            `match-${toRound}-${targetIndex}`
        );


    if (
        !sourceA ||
        !sourceB ||
        !target
    ) {

        return;

    }


    // --------------------------------------------------------
    // Posisi
    // --------------------------------------------------------

    const rectA =
        sourceA.getBoundingClientRect();


    const rectB =
        sourceB.getBoundingClientRect();


    const rectTarget =
        target.getBoundingClientRect();


    const x1 =
        rectA.right -
        wrapperRect.left;


    const y1 =
        rectA.top +
        rectA.height / 2 -
        wrapperRect.top;


    const x2 =
        rectB.right -
        wrapperRect.left;


    const y2 =
        rectB.top +
        rectB.height / 2 -
        wrapperRect.top;


    const x3 =
        rectTarget.left -
        wrapperRect.left;


    const y3 =
        rectTarget.top +
        rectTarget.height / 2 -
        wrapperRect.top;


    // --------------------------------------------------------
    // Titik tengah
    // --------------------------------------------------------

    const middleX =
        x1 +
        (x3 - x1) / 2;


    // --------------------------------------------------------
    // SVG PATH
    // --------------------------------------------------------

    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    const d = [

        `M ${x1} ${y1}`,

        `H ${middleX}`,

        `V ${y2}`,

        `H ${x2}`,

        `M ${middleX} ${y1}`,

        `V ${y3}`,

        `H ${x3}`

    ].join(" ");


    path.setAttribute(
        "d",
        d
    );


    path.setAttribute(
        "class",
        "bracket-line"
    );


    svg.appendChild(
        path
    );

}


// ============================================================
// RENDER SEMUA
// ============================================================

function render() {

    renderTitle();

    renderBracket();


    // Tunggu DOM selesai dibuat
    // sebelum menggambar garis.

    requestAnimationFrame(() => {

        drawBracketLines();

    });

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


// ============================================================
// REDRAW CONNECTOR SAAT RESIZE
// ============================================================

let resizeTimer;


window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimer
        );


        resizeTimer =
            setTimeout(
                () => {

                    drawBracketLines();

                },
                100
            );

    }
);


// ============================================================
// WINDOW LOAD
// ============================================================

window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {

                drawBracketLines();

            },
            300
        );

    }
);
