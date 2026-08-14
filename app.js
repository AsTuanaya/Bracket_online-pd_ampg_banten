// =====================================================
// FIREBASE IMPORT
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
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    firebaseConfig
} from "./firebase-config.js";


// =====================================================
// FIREBASE INITIALIZATION
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
// DOM HELPER
// =====================================================

const $ = (id) =>
    document.getElementById(id);


// =====================================================
// DOM ELEMENTS
// =====================================================

const statusEl =
    $("status");

const titleEl =
    $("title");

const updatedEl =
    $("updated");

const bracketEl =
    $("bracket");

const modalEl =
    $("modal");

const loginEl =
    $("login");

const adminEl =
    $("admin");

const emailEl =
    $("email");

const passwordEl =
    $("password");

const loginBtn =
    $("loginBtn");

const logoutBtn =
    $("logout");

const errorEl =
    $("error");

const titleInput =
    $("titleInput");

const teamsEl =
    $("teams");

const matchesEl =
    $("matches");

const saveBtn =
    $("save");

const resetBtn =
    $("reset");

const messageEl =
    $("message");


// =====================================================
// BRACKET CONFIGURATION
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
// APPLICATION STATE
// =====================================================

let state =
    createDefaultState();


// =====================================================
// DEFAULT STATE
// =====================================================

function createDefaultState() {

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


        updatedAt:
            null

    };

}


// =====================================================
// CREATE MATCHES
// =====================================================

function createMatches(count) {

    return Array.from(
        {
            length: count
        },
        () => ({

            sa: "",

            sb: "",

            winner: null

        })
    );

}


// =====================================================
// NORMALIZE DATABASE DATA
// =====================================================

function normalizeData(data) {

    const result =
        data || createDefaultState();


    result.title =
        result.title ||
        "Turnamen PD AMPG Banten";


    result.teams =
        Array.from(
            {
                length: 20
            },
            (_, index) => {

                return (
                    result.teams?.[index] ||
                    `PAIR ${index + 1}`
                );

            }
        );


    result.matches =
        result.matches || {};


    for (
        const [round, count]
        of Object.entries(ROUNDS)
    ) {

        result.matches[round] =
            Array.from(
                {
                    length: count
                },
                (_, index) => {

                    const old =
                        result.matches?.[round]?.[index];


                    return {

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
// GET PARTICIPANT
// =====================================================

function getParticipant(
    round,
    matchIndex,
    side
) {


    // -----------------------------------------------
    // ROUND 1
    // -----------------------------------------------

    if (
        round === "r1"
    ) {

        const teamIndex =
            matchIndex * 2 +
            (
                side === "a"
                    ? 0
                    : 1
            );


        return (
            state.teams[teamIndex] ||
            "—"
        );

    }


    // -----------------------------------------------
    // PREVIOUS ROUND
    // -----------------------------------------------

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


    const match =
        state
            .matches
            ?.[
                previousRound
            ]
            ?.[previousMatch];


    if (
        !match ||
        !match.winner
    ) {

        return "—";

    }


    return getParticipant(
        previousRound,
        previousMatch,
        match.winner
    );

}


// =====================================================
// RENDER PUBLIC BRACKET
// =====================================================

function renderPublic() {

    if (!bracketEl) {
        return;
    }


    if (titleEl) {

        titleEl.textContent =
            state.title;

    }


    if (updatedEl) {

        if (
            state.updatedAt
        ) {

            updatedEl.textContent =
                "Terakhir diperbarui: " +
                new Date(
                    state.updatedAt
                ).toLocaleString(
                    "id-ID"
                );

        } else {

            updatedEl.textContent =
                "Belum ada pembaruan.";

        }

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


    bracketEl.innerHTML =
        html;

}


// =====================================================
// RENDER ADMIN PANEL
// =====================================================

function renderAdmin() {

    if (!state) {
        return;
    }


    if (titleInput) {

        titleInput.value =
            state.title;

    }


    // =================================================
    // TEAMS
    // =================================================

    if (teamsEl) {

        teamsEl.innerHTML =
            state.teams
                .map(
                    (team, index) => {

                        return `

                        <div class="team-edit">

                            <span class="team-number">
                                ${index + 1}
                            </span>


                            <input
                                type="text"
                                data-team="${index}"
                                value="${escapeHtml(team)}"
                                placeholder="PAIR ${index + 1}"
                            >

                        </div>

                        `;

                    }
                )
                .join("");

    }


    // =================================================
    // MATCH EDITOR
    // =================================================

    if (matchesEl) {

        let html = "";


        for (
            const [round, count]
            of Object.entries(ROUNDS)
        ) {

            html += `

            <div class="editor-round">

                <div class="editor-round-title">

                    <strong>
                        ${ROUND_NAMES[round]}
                    </strong>

                    <span>
                        ${count} Match
                    </span>

                </div>

            `;


            for (
                let index = 0;
                index < count;
                index++
            ) {

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


                html += `

                <div class="editor">

                    <div class="editor-title">

                        <strong>
                            Match ${index + 1}
                        </strong>

                    </div>


                    <div class="score-row">

                        <div class="player">

                            <span>
                                ${escapeHtml(teamA)}
                            </span>

                            <input
                                type="number"
                                min="0"
                                data-score="${round}.${index}.sa"
                                value="${escapeHtml(match.sa)}"
                                placeholder="0"
                            >

                        </div>


                        <div class="vs">
                            VS
                        </div>


                        <div class="player">

                            <input
                                type="number"
                                min="0"
                                data-score="${round}.${index}.sb"
                                value="${escapeHtml(match.sb)}"
                                placeholder="0"
                            >

                            <span>
                                ${escapeHtml(teamB)}
                            </span>

                        </div>

                    </div>


                    <div class="winner-row">

                        <label>
                            Pemenang
                        </label>


                        <select
                            data-winner="${round}.${index}"
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

}


// =====================================================
// OPEN / CLOSE
// =====================================================

function closeModalAfterLogin() {

    if (modalEl) {

        modalEl.classList.add(
            "hidden"
        );

        document.body.classList.remove(
            "modal-open"
        );

    }

}


// =====================================================
// LOGIN
// =====================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        async () => {

            if (errorEl) {

                errorEl.textContent =
                    "";

            }


            const email =
                emailEl?.value.trim();


            const password =
                passwordEl?.value;


            if (
                !email ||
                !password
            ) {

                if (errorEl) {

                    errorEl.textContent =
                        "Email dan password wajib diisi.";

                }

                return;

            }


            loginBtn.disabled =
                true;


            loginBtn.textContent =
                "⏳ Memproses...";


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                if (emailEl) {
                    emailEl.value = "";
                }


                if (passwordEl) {
                    passwordEl.value = "";
                }


                closeModalAfterLogin();


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (errorEl) {

                    switch (
                        error.code
                    ) {

                        case "auth/invalid-credential":

                            errorEl.textContent =
                                "Email atau password salah.";

                            break;


                        case "auth/invalid-email":

                            errorEl.textContent =
                                "Format email tidak valid.";

                            break;


                        case "auth/user-not-found":

                            errorEl.textContent =
                                "Akun panitia tidak ditemukan.";

                            break;


                        case "auth/wrong-password":

                            errorEl.textContent =
                                "Password salah.";

                            break;


                        default:

                            errorEl.textContent =
                                "Login gagal. Periksa konfigurasi Firebase.";

                    }

                }

            }


            loginBtn.disabled =
                false;


            loginBtn.textContent =
                "🔐 Masuk";

        }
    );

}


// =====================================================
// ENTER KEY LOGIN
// =====================================================

[
    emailEl,
    passwordEl
]
.forEach(
    input => {

        if (!input) {
            return;
        }


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    loginBtn?.click();

                }

            }
        );

    }
);


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// =====================================================
// SAVE
// =====================================================

if (saveBtn) {

    saveBtn.addEventListener(
        "click",
        async () => {

            if (
                !auth.currentUser
            ) {

                showMessage(
                    "Anda belum login sebagai panitia.",
                    true
                );

                return;

            }


            try {

                const next =
                    JSON.parse(
                        JSON.stringify(state)
                    );


                // -------------------------------------
                // TITLE
                // -------------------------------------

                next.title =
                    titleInput.value.trim() ||
                    "Turnamen PD AMPG Banten";


                // -------------------------------------
                // TEAMS
                // -------------------------------------

                document
                    .querySelectorAll(
                        "[data-team]"
                    )
                    .forEach(
                        element => {

                            const index =
                                Number(
                                    element.dataset.team
                                );


                            next.teams[index] =
                                element.value.trim() ||
                                `PAIR ${index + 1}`;

                        }
                    );


                // -------------------------------------
                // SCORE
                // -------------------------------------

                document
                    .querySelectorAll(
                        "[data-score]"
                    )
                    .forEach(
                        element => {

                            const [
                                round,
                                index,
                                side
                            ] =
                                element.dataset.score
                                    .split(".");


                            next.matches[
                                round
                            ][
                                Number(index)
                            ][side] =
                                element.value;

                        }
                    );


                // -------------------------------------
                // WINNER
                // -------------------------------------

                document
                    .querySelectorAll(
                        "[data-winner]"
                    )
                    .forEach(
                        element => {

                            const [
                                round,
                                index
                            ] =
                                element.dataset.winner
                                    .split(".");


                            next.matches[
                                round
                            ][
                                Number(index)
                            ].winner =
                                element.value ||
                                null;

                        }
                    );


                // -------------------------------------
                // TIMESTAMP
                // -------------------------------------

                next.updatedAt =
                    Date.now();


                // -------------------------------------
                // FIREBASE
                // -------------------------------------

                await set(
                    tournamentRef,
                    next
                );


                state =
                    next;


                renderPublic();

                renderAdmin();


                showMessage(
                    "✓ Tersimpan. Perubahan langsung terlihat oleh publik."
                );


            } catch (error) {

                console.error(
                    "Save error:",
                    error
                );


                showMessage(
                    "Gagal menyimpan. Periksa Firebase Database Rules.",
                    true
                );

            }

        }
    );

}


// =====================================================
// RESET
// =====================================================

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        async () => {

            if (
                !auth.currentUser
            ) {

                showMessage(
                    "Anda belum login.",
                    true
                );

                return;

            }


            const confirmed =
                confirm(
                    "Yakin ingin mereset seluruh bracket?"
                );


            if (!confirmed) {
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


                showMessage(
                    "✓ Bracket berhasil direset."
                );


            } catch (error) {

                console.error(
                    "Reset error:",
                    error
                );


                showMessage(
                    "Reset gagal.",
                    true
                );

            }

        }
    );

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    text,
    isError = false
) {

    if (!messageEl) {
        return;
    }


    messageEl.textContent =
        text;


    messageEl.className =
        isError
            ? "message error-message"
            : "message success-message";


    setTimeout(
        () => {

            messageEl.textContent =
                "";

        },
        4000
    );

}


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


        renderPublic();


        if (
            auth.currentUser
        ) {

            renderAdmin();

        }


        if (statusEl) {

            statusEl.textContent =
                "● LIVE";

            statusEl.className =
                "status online";

        }

    },

    error => {

        console.error(
            "Firebase Database error:",
            error
        );


        state =
            createDefaultState();


        renderPublic();


        if (statusEl) {

            statusEl.textContent =
                "● OFFLINE";

            statusEl.className =
                "status offline";

        }

    }
);


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    user => {

        if (user) {

            // -----------------------------------------
            // USER LOGIN
            // -----------------------------------------

            if (loginEl) {

                loginEl.classList.add(
                    "hidden"
                );

            }


            if (adminEl) {

                adminEl.classList.remove(
                    "hidden"
                );

            }


            renderAdmin();


        } else {

            // -----------------------------------------
            // USER LOGOUT
            // -----------------------------------------

            if (loginEl) {

                loginEl.classList.remove(
                    "hidden"
                );

            }


            if (adminEl) {

                adminEl.classList.add(
                    "hidden"
                );

            }

        }

    }
);


// =====================================================
// INITIAL RENDER
// =====================================================

renderPublic();


console.log(
    "✓ Bracket Online PD AMPG Banten aktif."
);
