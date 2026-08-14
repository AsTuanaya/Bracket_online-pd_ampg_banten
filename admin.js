// =====================================================
// ADMIN.JS
// PANEL PANITIA
// PD AMPG BANTEN
// =====================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getDatabase,
    ref,
    onValue,
    set
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


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


const auth =
    getAuth(app);


const tournamentRef =
    ref(db, "tournament");


// =====================================================
// CONFIG
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
// ELEMENTS
// =====================================================

const titleInput =
    document.getElementById(
        "titleInput"
    );


const teamsEl =
    document.getElementById(
        "teams"
    );


const matchesEl =
    document.getElementById(
        "matches"
    );


const saveBtn =
    document.getElementById(
        "saveBtn"
    );


const resetBtn =
    document.getElementById(
        "resetBtn"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const messageEl =
    document.getElementById(
        "message"
    );


// =====================================================
// STATE
// =====================================================

let state =
    createDefaultState();


let authenticated =
    false;


// =====================================================
// DEFAULT STATE
// =====================================================

function createMatches(count) {

    return Array.from(
        { length: count },
        () => ({

            teamA: "",

            teamB: "",

            sa: "",

            sb: "",

            winner: null

        })
    );

}

function createDefaultState() {

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

    const result =
        data || createDefaultState();


    result.title =
        result.title ||
        "Turnamen PD AMPG Banten";


    result.teams =
        Array.from(
            { length: 20 },
            (_, i) =>
                result.teams?.[i] ||
                `PAIR ${i + 1}`
        );


    result.matches =
        result.matches || {};


    for (
        const [round, count]
        of Object.entries(ROUNDS)
    ) {

        result.matches[round] =
            Array.from(
                { length: count },
                (_, i) => {

                    const old =
                        result.matches?.[round]?.[i];


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


    return result;

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
// GET PARTICIPANT
// =====================================================

function getParticipant(
    round,
    matchIndex,
    side
) {

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
            ?.[previousRound]
            ?.[previousMatch];


    if (
        !previous ||
        !previous.winner
    ) {

        return "—";

    }


    return getParticipant(
        previousRound,
        previousMatch,
        previous.winner
    );

}


// =====================================================
// RENDER TEAMS
// =====================================================

function renderTeams() {

    teamsEl.innerHTML =
        state.teams
            .map(
                (team, index) => `

                <div class="admin-team-row">

                    <span class="admin-team-number">
                        ${index + 1}
                    </span>


                    <input
                        type="text"
                        data-team="${index}"
                        value="${escapeHtml(team)}"
                        placeholder="PAIR ${index + 1}"
                    >

                </div>

            `
            )
            .join("");

}


// =====================================================
// RENDER MATCHES
// =====================================================

function renderMatches() {

    let html = "";


    for (
        const [round, count]
        of Object.entries(ROUNDS)
    ) {

        html += `

            <div class="admin-round">

                <div class="admin-round-header">

                    <strong>
                        ${ROUND_NAMES[round]}
                    </strong>

                    <span>
                        ${count} Match
                    </span>

                </div>

        `;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const match =
                state.matches[round][i];


            const teamA =
                getParticipant(
                    round,
                    i,
                    "a"
                );


            const teamB =
                getParticipant(
                    round,
                    i,
                    "b"
                );


            html += `

                <div class="admin-match">

                    <div class="admin-match-title">
                        Match ${i + 1}
                    </div>


                    <div class="admin-score-grid">

                        <div class="admin-player">

                            <span>
                                ${escapeHtml(teamA)}
                            </span>


                            <input
                                type="number"
                                min="0"
                                data-score="${round}.${i}.sa"
                                value="${escapeHtml(match.sa)}"
                                placeholder="0"
                            >

                        </div>


                        <div class="admin-vs">
                            VS
                        </div>


                        <div class="admin-player">

                            <input
                                type="number"
                                min="0"
                                data-score="${round}.${i}.sb"
                                value="${escapeHtml(match.sb)}"
                                placeholder="0"
                            >


                            <span>
                                ${escapeHtml(teamB)}
                            </span>

                        </div>

                    </div>


                    <div class="admin-winner">

                        <label>
                            Pemenang
                        </label>


                        <select
                            data-winner="${round}.${i}"
                        >

                            <option value="">
                                Belum dipilih
                            </option>


                            <option
                                value="a"
                                ${
                                    match.winner === "a"
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(teamA)}
                            </option>


                            <option
                                value="b"
                                ${
                                    match.winner === "b"
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(teamB)}
                            </option>

                        </select>

                    </div>

                </div>

            `;

        }


        html += `
            </div>
        `;

    }


    matchesEl.innerHTML =
        html;

}


// =====================================================
// RENDER
// =====================================================

function render() {

    titleInput.value =
        state.title;


    renderTeams();

    renderMatches();

}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    error = false
) {

    messageEl.textContent =
        text;


    messageEl.className =
        error
            ? "dashboard-message error"
            : "dashboard-message success";


    setTimeout(
        () => {

            messageEl.textContent =
                "";

        },
        4000
    );

}


// =====================================================
// SAVE
// =====================================================

saveBtn.addEventListener(
    "click",
    async () => {

        if (!authenticated) {

            showMessage(
                "Sesi panitia tidak aktif.",
                true
            );

            return;

        }


        try {

            const next =
                JSON.parse(
                    JSON.stringify(state)
                );


            // TITLE

            next.title =
                titleInput.value.trim() ||
                "Turnamen PD AMPG Banten";


            // TEAMS

            document
                .querySelectorAll(
                    "[data-team]"
                )
                .forEach(
                    input => {

                        const index =
                            Number(
                                input.dataset.team
                            );


                        next.teams[index] =
                            input.value.trim() ||
                            `PAIR ${index + 1}`;

                    }
                );


            // SCORES

            document
                .querySelectorAll(
                    "[data-score]"
                )
                .forEach(
                    input => {

                        const [
                            round,
                            index,
                            side
                        ] =
                            input.dataset.score
                                .split(".");


                        next.matches[
                            round
                        ][
                            Number(index)
                        ][side] =
                            input.value;

                    }
                );


            // WINNERS

            document
                .querySelectorAll(
                    "[data-winner]"
                )
                .forEach(
                    select => {

                        const [
                            round,
                            index
                        ] =
                            select.dataset.winner
                                .split(".");


                        next.matches[
                            round
                        ][
                            Number(index)
                        ].winner =
                            select.value ||
                            null;

                    }
                );


            next.updatedAt =
                Date.now();


            await set(
                tournamentRef,
                next
            );


            state =
                next;


            render();


            showMessage(
                "✓ Perubahan berhasil disimpan. Publik akan melihat update secara realtime."
            );


        } catch (error) {

            console.error(
                "Save error:",
                error
            );


            showMessage(
                "Gagal menyimpan data Firebase.",
                true
            );

        }

    }
);


// =====================================================
// RESET
// =====================================================

resetBtn.addEventListener(
    "click",
    async () => {

        if (!authenticated) {

            showMessage(
                "Sesi panitia tidak aktif.",
                true
            );

            return;

        }


        const confirmReset =
            confirm(
                "Yakin ingin mereset seluruh bracket?"
            );


        if (!confirmReset) {
            return;
        }


        try {

            const next =
                createDefaultState();


            next.updatedAt =
                Date.now();


            await set(
                tournamentRef,
                next
            );


            state =
                next;


            render();


            showMessage(
                "✓ Bracket berhasil direset."
            );


        } catch (error) {

            console.error(
                error
            );


            showMessage(
                "Gagal melakukan reset.",
                true
            );

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);


            window.location.href =
                "admin.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            authenticated =
                false;


            /*
             * Kalau belum login,
             * jangan biarkan panel admin
             * digunakan.
             */

            window.location.href =
                "admin.html";


            return;

        }


        authenticated =
            true;


        console.log(
            "Panitia login:",
            user.email
        );


        render();

    }
);


// =====================================================
// REALTIME DATABASE
// =====================================================

onValue(
    tournamentRef,
    snapshot => {

        state =
            normalizeData(
                snapshot.val()
            );


        if (authenticated) {

            render();

        }

    },
    error => {

        console.error(
            "Database error:",
            error
        );

        showMessage(
            "Tidak dapat membaca Firebase Database.",
            true
        );

    }
);


console.log(
    "✓ admin.js — Panel Panitia aktif."
);
