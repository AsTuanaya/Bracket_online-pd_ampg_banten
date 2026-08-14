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


// ======================================================
// ELEMENT
// ======================================================

const $ = (id) => document.getElementById(id);

const modal = $("modal");
const adminBtn = $("adminBtn");
const closeBtn = $("close");

const loginView = $("login");
const adminView = $("admin");

const loginBtn = $("loginBtn");
const logoutBtn = $("logout");

const saveBtn = $("save");
const resetBtn = $("reset");

const statusEl = $("status");
const errorEl = $("error");
const messageEl = $("message");

const titleInput = $("titleInput");
const teamsEl = $("teams");
const matchesEl = $("matches");

const titleEl = $("title");
const updatedEl = $("updated");
const bracketEl = $("bracket");


// ======================================================
// FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const auth = getAuth(app);

const dbRef = ref(db, "tournament");


// ======================================================
// BRACKET CONFIG
// ======================================================

const ROUND_INFO = [
    ["r1", "ROUND 1"],
    ["r2", "ROUND 2"],
    ["r3", "ROUND 3"],
    ["r4", "SEMIFINAL"],
    ["r5", "FINAL"]
];

const COUNT = {
    r1: 20,
    r2: 10,
    r3: 5,
    r4: 2,
    r5: 1
};


let state = null;


// ======================================================
// DEFAULT DATA
// ======================================================

function createDefaultState() {

    return {

        title: "Turnamen PD AMPG Banten",

        teams: Array.from(
            { length: 20 },
            (_, i) => `PAIR ${i + 1}`
        ),

        matches: {

            r1: Array.from(
                { length: 20 },
                () => ({
                    sa: "",
                    sb: "",
                    winner: null
                })
            ),

            r2: Array.from(
                { length: 10 },
                () => ({
                    sa: "",
                    sb: "",
                    winner: null
                })
            ),

            r3: Array.from(
                { length: 5 },
                () => ({
                    sa: "",
                    sb: "",
                    winner: null
                })
            ),

            r4: Array.from(
                { length: 2 },
                () => ({
                    sa: "",
                    sb: "",
                    winner: null
                })
            ),

            r5: [
                {
                    sa: "",
                    sb: "",
                    winner: null
                }
            ]
        },

        updatedAt: null
    };
}


// ======================================================
// NORMALIZE DATA
// ======================================================

function normalize(data) {

    const result = data || createDefaultState();

    result.title =
        result.title ||
        "Turnamen PD AMPG Banten";


    result.teams = Array.from(
        { length: 20 },
        (_, i) =>
            result.teams?.[i] ||
            `PAIR ${i + 1}`
    );


    result.matches =
        result.matches || {};


    for (const [round, count] of Object.entries(COUNT)) {

        result.matches[round] =
            Array.from(
                { length: count },
                (_, i) => ({

                    sa:
                        result.matches[round]?.[i]?.sa ??
                        "",

                    sb:
                        result.matches[round]?.[i]?.sb ??
                        "",

                    winner:
                        result.matches[round]?.[i]?.winner ??
                        null
                })
            );
    }

    return result;
}


// ======================================================
// GET PARTICIPANT
// ======================================================

function getParticipant(round, index, side) {

    if (round === "r1") {

        const teamIndex =
            index * 2 +
            (side === "a" ? 0 : 1);

        return (
            state.teams[teamIndex] ||
            "—"
        );
    }


    const previousRound = {

        r2: "r1",
        r3: "r2",
        r4: "r3",
        r5: "r4"

    }[round];


    const sourceIndex =
        index * 2 +
        (side === "a" ? 0 : 1);


    const source =
        state.matches[previousRound]?.[sourceIndex];


    if (!source?.winner) {

        return "—";
    }


    return getParticipant(

        previousRound,

        sourceIndex,

        source.winner === "a"
            ? "a"
            : "b"
    );
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            (character) => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"

            }[character])
        );
}


// ======================================================
// RENDER PUBLIC BRACKET
// ======================================================

function renderPublic() {

    if (!state) {
        return;
    }


    titleEl.textContent =
        state.title;


    updatedEl.textContent =
        state.updatedAt

            ? "Terakhir diperbarui: " +
              new Date(
                  state.updatedAt
              ).toLocaleString("id-ID")

            : "Belum ada pembaruan.";


    bracketEl.innerHTML =
        ROUND_INFO.map(
            ([round, label]) => {

                return `

                <section class="round">

                    <h3>
                        ${label}
                    </h3>

                    <div class="matches">

                        ${
                            state.matches[round]
                                .map(
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


                                        return `

                                        <article class="match">

                                            <div class="meta">
                                                Match ${index + 1}
                                            </div>


                                            <div class="team ${
                                                match.winner === "a"
                                                    ? "win"
                                                    : ""
                                            }">

                                                <span class="${
                                                    teamA === "—"
                                                        ? "empty"
                                                        : ""
                                                }">

                                                    ${escapeHtml(teamA)}

                                                </span>

                                                <b>
                                                    ${escapeHtml(match.sa)}
                                                </b>

                                            </div>


                                            <div class="team ${
                                                match.winner === "b"
                                                    ? "win"
                                                    : ""
                                            }">

                                                <span class="${
                                                    teamB === "—"
                                                        ? "empty"
                                                        : ""
                                                }">

                                                    ${escapeHtml(teamB)}

                                                </span>

                                                <b>
                                                    ${escapeHtml(match.sb)}
                                                </b>

                                            </div>

                                        </article>

                                        `;
                                    }
                                )
                                .join("")
                        }

                    </div>

                </section>

                `;
            }
        )
        .join("");
}


// ======================================================
// RENDER ADMIN
// ======================================================

function renderAdmin() {

    if (!state) {
        return;
    }


    titleInput.value =
        state.title;


    // --------------------------------------------------
    // TEAMS
    // --------------------------------------------------

    teamsEl.innerHTML =
        state.teams
            .map(
                (team, index) => {

                    return `

                    <div class="teamedit">

                        <b>
                            ${index + 1}
                        </b>

                        <input
                            data-team="${index}"
                            value="${escapeHtml(team)}"
                        >

                    </div>

                    `;
                }
            )
            .join("");


    // --------------------------------------------------
    // MATCHES
    // --------------------------------------------------

    let html = "";


    for (
        const [round, count]
        of Object.entries(COUNT)
    ) {

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

                <b>
                    ${round.toUpperCase()}
                    —
                    Match ${index + 1}
                </b>


                <div class="row">

                    <span>
                        ${escapeHtml(teamA)}
                    </span>

                    <input
                        data-score="${round}.${index}.sa"
                        value="${escapeHtml(match.sa)}"
                        placeholder="Skor"
                    >

                </div>


                <div class="row">

                    <span>
                        ${escapeHtml(teamB)}
                    </span>

                    <input
                        data-score="${round}.${index}.sb"
                        value="${escapeHtml(match.sb)}"
                        placeholder="Skor"
                    >

                </div>


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

            `;
        }
    }


    matchesEl.innerHTML =
        html;
}


// ======================================================
// OPEN ADMIN PANEL
// ======================================================

function openAdminPanel() {

    console.log(
        "Panel Panitia dibuka"
    );

    modal.classList.remove(
        "hidden"
    );

    errorEl.textContent = "";
}


// ======================================================
// CLOSE ADMIN PANEL
// ======================================================

function closeAdminPanel() {

    modal.classList.add(
        "hidden"
    );
}


// ======================================================
// BUTTON EVENTS
// ======================================================

adminBtn.addEventListener(
    "click",
    openAdminPanel
);


closeBtn.addEventListener(
    "click",
    closeAdminPanel
);


modal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === modal
        ) {

            closeAdminPanel();
        }
    }
);


// ======================================================
// LOGIN
// ======================================================

loginBtn.addEventListener(
    "click",
    async () => {

        errorEl.textContent = "";

        const email =
            $("email").value.trim();

        const password =
            $("password").value;


        if (!email || !password) {

            errorEl.textContent =
                "Email dan password wajib diisi.";

            return;
        }


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        } catch (error) {

            console.error(error);

            errorEl.textContent =
                "Login gagal. Periksa email/password Firebase.";
        }
    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);
    }
);


// ======================================================
// SAVE
// ======================================================

saveBtn.addEventListener(
    "click",
    async () => {

        try {

            const next =
                JSON.parse(
                    JSON.stringify(state)
                );


            next.title =
                titleInput.value.trim() ||
                "Turnamen PD AMPG Banten";


            // ------------------------------------------
            // TEAMS
            // ------------------------------------------

            document
                .querySelectorAll(
                    "[data-team]"
                )
                .forEach(
                    (element) => {

                        const index =
                            Number(
                                element.dataset.team
                            );


                        next.teams[index] =
                            element.value.trim() ||
                            `PAIR ${index + 1}`;
                    }
                );


            // ------------------------------------------
            // SCORE
            // ------------------------------------------

            document
                .querySelectorAll(
                    "[data-score]"
                )
                .forEach(
                    (element) => {

                        const [
                            round,
                            index,
                            key
                        ] =
                            element.dataset.score
                                .split(".");


                        next.matches[round][
                            Number(index)
                        ][key] =
                            element.value;
                    }
                );


            // ------------------------------------------
            // WINNER
            // ------------------------------------------

            document
                .querySelectorAll(
                    "[data-winner]"
                )
                .forEach(
                    (element) => {

                        const [
                            round,
                            index
                        ] =
                            element.dataset.winner
                                .split(".");


                        next.matches[round][
                            Number(index)
                        ].winner =
                            element.value ||
                            null;
                    }
                );


            next.updatedAt =
                Date.now();


            await set(
                dbRef,
                next
            );


            state =
                next;


            renderPublic();

            renderAdmin();


            messageEl.textContent =
                "Tersimpan — publik langsung melihat perubahan.";


            setTimeout(
                () => {

                    messageEl.textContent =
                        "";

                },
                3000
            );

        } catch (error) {

            console.error(error);

            messageEl.textContent =
                "Gagal menyimpan. Periksa Firebase Rules.";
        }
    }
);


// ======================================================
// RESET
// ======================================================

resetBtn.addEventListener(
    "click",
    async () => {

        if (
            !confirm(
                "Reset seluruh bracket?"
            )
        ) {

            return;
        }


        try {

            const next =
                createDefaultState();


            next.updatedAt =
                Date.now();


            await set(
                dbRef,
                next
            );

        } catch (error) {

            console.error(error);

            messageEl.textContent =
                "Reset gagal. Periksa Firebase Rules.";
        }
    }
);


// ======================================================
// FIREBASE REALTIME
// ======================================================

onValue(
    dbRef,

    (snapshot) => {

        state =
            normalize(
                snapshot.val()
            );


        renderPublic();


        if (
            auth.currentUser
        ) {

            renderAdmin();
        }


        statusEl.textContent =
            "● LIVE";


        statusEl.className =
            "online";
    },


    (error) => {

        console.error(
            "Firebase Database Error:",
            error
        );


        statusEl.textContent =
            "DATABASE ERROR";


        statusEl.className =
            "";


        errorEl.textContent =
            "Database Firebase tidak dapat diakses.";
    }
);


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,

    (user) => {

        if (user) {

            loginView.classList.add(
                "hidden"
            );

            adminView.classList.remove(
                "hidden"
            );


            renderAdmin();

        } else {

            loginView.classList.remove(
                "hidden"
            );

            adminView.classList.add(
                "hidden"
            );
        }
    }
);


// ======================================================
// INITIAL
// ======================================================

state =
    normalize(null);


renderPublic();
