// ============================================================
// ADMIN.JS
// PANEL PANITIA - TURNAMEN PD AMPG BANTEN
// ============================================================

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
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    firebaseConfig
} from "./firebase-config.js";


// ============================================================
// FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const auth = getAuth(app);

const tournamentRef =
    ref(db, "tournament");


// ============================================================
// KONFIGURASI BRACKET
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
// DATA DEFAULT
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
            "Turnamen PD AMPG Banten",

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

        updatedAt: null

    };

}


// ============================================================
// NORMALIZE DATA
// ============================================================

function normalizeData(data) {

    const defaults =
        createDefaultData();

    const source =
        data || {};

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


    // ========================================================
    // HANYA 20 PAIR
    // ========================================================

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


    // ========================================================
    // MATCH
    // ========================================================

    for (
        const [round, config]
        of Object.entries(ROUND_CONFIG)
    ) {

        result.matches[round] =
            Array.from(
                {
                    length: config.matches
                },
                (_, index) => {

                    const oldMatch =
                        source
                            .matches
                            ?. [round]
                            ?. [index] ||
                        {};

                    return {

                        sa:
                            oldMatch.sa ?? "",

                        sb:
                            oldMatch.sb ?? "",

                        winner:
                            oldMatch.winner ??
                            null

                    };

                }
            );

    }


    return result;

}


// ============================================================
// STATE
// ============================================================

let state =
    createDefaultData();


// ============================================================
// ELEMENT HELPER
// ============================================================

function $(id) {

    return document.getElementById(id);

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
// GET TEAM ROUND 1
// ============================================================

function getRound1Team(
    matchIndex,
    side
) {

    const index =
        matchIndex * 2 +
        (
            side === "a"
                ? 0
                : 1
        );


    if (
        index < 0 ||
        index >= 20
    ) {

        return "—";

    }


    return (
        state.teams[index] ||
        `PAIR ${index + 1}`
    );

}


// ============================================================
// GET WINNER
// ============================================================

function getWinner(
    round,
    matchIndex
) {

    const match =
        state.matches?.[round]?.[matchIndex];


    if (
        !match ||
        !match.winner
    ) {

        return null;

    }


    return match.winner;

}


// ============================================================
// AUTO ADVANCE - GET PARTICIPANT
// ============================================================

function getParticipant(
    round,
    matchIndex,
    side
) {

    // ========================================================
    // ROUND 1
    // ========================================================

    if (round === "r1") {

        const teamIndex =
            matchIndex * 2 +
            (
                side === "a"
                    ? 0
                    : 1
            );


        if (
            teamIndex >= 20
        ) {

            return "—";

        }


        return (
            state.teams?.[teamIndex] ||
            `PAIR ${teamIndex + 1}`
        );

    }


    // ========================================================
    // ROUND 2
    //
    // R1 M1 + R1 M2 → R2 M1
    // R1 M3 + R1 M4 → R2 M2
    // dst.
    // ========================================================

    if (round === "r2") {

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
    // R2 M1 + R2 M2 → R3 M1
    // R2 M3 + R2 M4 → R3 M2
    // R2 M5 → R3 M3
    // ========================================================

    if (round === "r3") {

        // --------------------------------------------
        // Match 1
        // --------------------------------------------

        if (matchIndex === 0) {

            if (side === "a") {

                return getWinnerName(
                    "r2",
                    0
                );

            }

            return getWinnerName(
                "r2",
                1
            );

        }


        // --------------------------------------------
        // Match 2
        // --------------------------------------------

        if (matchIndex === 1) {

            if (side === "a") {

                return getWinnerName(
                    "r2",
                    2
                );

            }

            return getWinnerName(
                "r2",
                3
            );

        }


        // --------------------------------------------
        // Match 3
        // --------------------------------------------

        if (matchIndex === 2) {

            if (side === "a") {

                return getWinnerName(
                    "r2",
                    4
                );

            }

            return "BYE";

        }


        // --------------------------------------------
        // Match 4
        // --------------------------------------------

        if (matchIndex === 3) {

            return "—";

        }


        // --------------------------------------------
        // Match 5
        // --------------------------------------------

        if (matchIndex === 4) {

            return "—";

        }

    }


    // ========================================================
    // ROUND 4 - SEMIFINAL
    // ========================================================

    if (round === "r4") {

        // ----------------------------------------------------
        // SEMIFINAL 1
        //
        // R3 M1 vs R3 M2
        // ----------------------------------------------------

        if (matchIndex === 0) {

            if (side === "a") {

                return getWinnerName(
                    "r3",
                    0
                );

            }

            return getWinnerName(
                "r3",
                1
            );

        }


        // ----------------------------------------------------
        // SEMIFINAL 2
        //
        // R3 M3 + BYE
        //
        // Slot ini dapat digunakan panitia
        // untuk menentukan peserta kedua.
        // ----------------------------------------------------

        if (matchIndex === 1) {

            if (side === "a") {

                return getWinnerName(
                    "r3",
                    2
                );

            }

            return "BYE";

        }

    }


    // ========================================================
    // ROUND 5 - FINAL
    // ========================================================

    if (round === "r5") {

        if (side === "a") {

            return getWinnerName(
                "r4",
                0
            );

        }


        return getWinnerName(
            "r4",
            1
        );

    }


    return "—";

}


// ============================================================
// GET WINNER NAME
// ============================================================

function getWinnerName(
    round,
    matchIndex
) {

    const match =
        state.matches?.[round]?.[matchIndex];


    if (
        !match ||
        !match.winner
    ) {

        return "—";

    }


    if (
        match.winner !== "a" &&
        match.winner !== "b"
    ) {

        return "—";

    }


    const winner =
        getParticipant(
            round,
            matchIndex,
            match.winner
        );


    if (
        !winner ||
        winner === "—"
    ) {

        return "—";

    }


    return winner;

}


    return getParticipant(
        round,
        matchIndex,
        match.winner
    );

}


// ============================================================
// RENDER TEAMS
// ============================================================

function renderTeams() {

    const container =
        $("teams");

    if (!container) {

        return;

    }


    container.innerHTML = "";


    state.teams.forEach(
        (team, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "team-edit";


            row.innerHTML = `

                <div class="team-number">
                    ${index + 1}
                </div>

                <input
                    type="text"
                    class="team-input"
                    data-team-index="${index}"
                    value="${escapeHTML(team)}"
                    placeholder="PAIR ${index + 1}"
                >

            `;


            container.appendChild(
                row
            );

        }
    );

}


// ============================================================
// RENDER MATCHES
// ============================================================

function renderMatches() {

    const container =
        $("matches");

    if (!container) {

        return;

    }


    container.innerHTML = "";


    for (
        const [
            round,
            config
        ]
        of Object.entries(
            ROUND_CONFIG
        )
    ) {

        const roundTitle =
            document.createElement(
                "div"
            );

        roundTitle.className =
            "admin-round-title";


        roundTitle.innerHTML = `

            <div>
                ${config.title}
            </div>

            <small>
                ${config.subtitle}
            </small>

        `;


        container.appendChild(
            roundTitle
        );


        for (
            let index = 0;
            index < config.matches;
            index++
        ) {

            renderMatch(
                container,
                round,
                index
            );

        }

    }

}


// ============================================================
// RENDER ONE MATCH
// ============================================================

function renderMatch(
    container,
    round,
    index
) {

    const isBye =
    teamA === "BYE" ||
    teamB === "BYE";

    const match =
        state.matches[round][index];


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


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "admin-match";


    card.innerHTML = `

        <div class="admin-match-header">

            <strong>
                ${ROUND_CONFIG[round].title}
            </strong>

            <span>
                Match ${index + 1}
            </span>

        </div>


        <div class="admin-team-row">

            <div class="admin-team-name">
                ${escapeHTML(teamA)}
            </div>

            <input
                type="text"
                class="score-input"
                data-score="${round}.${index}.sa"
                value="${escapeHTML(match.sa)}"
                placeholder="Skor"
            >

        </div>


        <div class="admin-team-row">

            <div class="admin-team-name">
                ${escapeHTML(teamB)}
            </div>

            <input
                type="text"
                class="score-input"
                data-score="${round}.${index}.sb"
                value="${escapeHTML(match.sb)}"
                placeholder="Skor"
            >

        </div>


        <div class="winner-row">

            <label>
                Pemenang
            </label>

            <select
                data-winner="${round}.${index}"
            >

                <option
                    value=""
                    ${!match.winner ? "selected" : ""}
                >
                    Belum dipilih
                </option>

                <option
                    value="a"
                    ${match.winner === "a" ? "selected" : ""}
                >
                    ${escapeHTML(teamA)}
                </option>

                <option
                    value="b"
                    ${match.winner === "b" ? "selected" : ""}
                >
                    ${escapeHTML(teamB)}
                </option>

            </select>

        </div>

    `;


    container.appendChild(
        card
    );

}


// ============================================================
// UPDATE LOCAL STATE FROM FORM
// ============================================================

function collectFormData() {

    // --------------------------------------------------------
    // Teams
    // --------------------------------------------------------

    document
        .querySelectorAll(
            "[data-team-index]"
        )
        .forEach(
            input => {

                const index =
                    Number(
                        input.dataset.teamIndex
                    );


                if (
                    index >= 0 &&
                    index < 20
                ) {

                    state.teams[index] =
                        input.value.trim() ||
                        `PAIR ${index + 1}`;

                }

            }
        );


    // --------------------------------------------------------
    // Scores
    // --------------------------------------------------------

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
                    input
                        .dataset
                        .score
                        .split(".");


                if (
                    state.matches[round] &&
                    state.matches[round][index]
                ) {

                    state.matches[round][index][side] =
                        input.value.trim();

                }

            }
        );


    // --------------------------------------------------------
    // Winner
    // --------------------------------------------------------

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
                    select
                        .dataset
                        .winner
                        .split(".");


                if (
                    state.matches[round] &&
                    state.matches[round][index]
                ) {

                    state.matches[round][index].winner =
                        select.value ||
                        null;

                }

            }
        );

}


// ============================================================
// SAVE
// ============================================================

async function saveTournament() {

    collectFormData();


    state.updatedAt =
        Date.now();


    try {

        await set(
            tournamentRef,
            state
        );


        showMessage(
            "✓ Data berhasil disimpan. Publik langsung melihat perubahan.",
            "success"
        );


        renderMatches();

    }
    catch (error) {

        console.error(
            error
        );


        showMessage(
            "✕ Gagal menyimpan data ke Firebase.",
            "error"
        );

    }

}


// ============================================================
// RESET
// ============================================================

async function resetTournament() {

    const confirmed =
        confirm(
            "Yakin ingin mereset seluruh bracket?\n\nSemua nama PAIR, skor, dan pemenang akan dikembalikan ke kondisi awal."
        );


    if (!confirmed) {

        return;

    }


    const newData =
        createDefaultData();


    newData.updatedAt =
        Date.now();


    try {

        await set(
            tournamentRef,
            newData
        );


        state =
            normalizeData(
                newData
            );


        renderTeams();

        renderMatches();


        showMessage(
            "✓ Bracket berhasil direset.",
            "success"
        );

    }
    catch (error) {

        console.error(
            error
        );


        showMessage(
            "✕ Gagal melakukan reset.",
            "error"
        );

    }

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    message,
    type = "success"
) {

    const element =
        $("message");


    if (!element) {

        alert(
            message
        );

        return;

    }


    element.textContent =
        message;


    element.className =
        `message ${type}`;


    setTimeout(
        () => {

            element.textContent =
                "";

            element.className =
                "message";

        },
        4000
    );

}


// ============================================================
// LOGIN
// ============================================================

async function loginAdmin() {

    const email =
        $("email")?.value.trim();


    const password =
        $("password")?.value;


    const error =
        $("error");


    if (!email || !password) {

        if (error) {

            error.textContent =
                "Email dan password wajib diisi.";

        }

        return;

    }


    if (error) {

        error.textContent =
            "";

    }


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    }
    catch (err) {

        console.error(
            err
        );


        let message =
            "Login gagal.";


        if (
            err.code ===
            "auth/invalid-credential"
        ) {

            message =
                "Email atau password salah.";

        }
        else if (
            err.code ===
            "auth/user-not-found"
        ) {

            message =
                "Akun panitia tidak ditemukan.";

        }
        else if (
            err.code ===
            "auth/wrong-password"
        ) {

            message =
                "Password salah.";

        }
        else if (
            err.code ===
            "auth/invalid-email"
        ) {

            message =
                "Format email tidak valid.";

        }


        if (error) {

            error.textContent =
                message;

        }

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutAdmin() {

    try {

        await signOut(
            auth
        );

    }
    catch (error) {

        console.error(
            error
        );

    }

}


// ============================================================
// SHOW ADMIN PANEL
// ============================================================

function showAdminPanel() {

    $("login")?.classList.add(
        "hidden"
    );


    $("admin")?.classList.remove(
        "hidden"
    );


    renderTeams();

    renderMatches();

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

    $("login")?.classList.remove(
        "hidden"
    );


    $("admin")?.classList.add(
        "hidden"
    );

}


// ============================================================
// FIREBASE REALTIME DATABASE
// ============================================================

onValue(
    tournamentRef,
    snapshot => {

        const data =
            snapshot.val();


        state =
            normalizeData(
                data
            );


        renderTeams();

        renderMatches();

    },
    error => {

        console.error(
            "Firebase:",
            error
        );


        showMessage(
            "Tidak dapat membaca data Firebase.",
            "error"
        );

    }
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    user => {

        if (user) {

            showAdminPanel();

        }
        else {

            showLogin();

        }

    }
);


// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {


        // ----------------------------------------------------
        // LOGIN
        // ----------------------------------------------------

        $("loginBtn")?.addEventListener(
            "click",
            loginAdmin
        );


        $("password")?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    loginAdmin();

                }

            }
        );


        // ----------------------------------------------------
        // LOGOUT
        // ----------------------------------------------------

        $("logout")?.addEventListener(
            "click",
            logoutAdmin
        );


        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------

        $("save")?.addEventListener(
            "click",
            saveTournament
        );


        // ----------------------------------------------------
        // RESET
        // ----------------------------------------------------

        $("reset")?.addEventListener(
            "click",
            resetTournament
        );


    }
);
