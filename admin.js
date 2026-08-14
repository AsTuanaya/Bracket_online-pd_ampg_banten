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

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const auth = getAuth(app);

const tournamentRef = ref(db, "tournament");


// =====================================================
// KONFIGURASI BRACKET
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
// ELEMENT HTML
// =====================================================

const titleInput =
    document.getElementById("titleInput");

const teamsEl =
    document.getElementById("teams");

const matchesEl =
    document.getElementById("matches");

const saveBtn =
    document.getElementById("saveBtn");

const resetBtn =
    document.getElementById("resetBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const messageEl =
    document.getElementById("message");


// =====================================================
// STATE
// =====================================================

let state = createDefaultState();

let authenticated = false;


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
// NORMALIZE DATA
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

    return String(value ?? "")
        .replace(
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
// GET AUTOMATIC PARTICIPANT
//
// Hanya mengambil nama dari ronde sebelumnya.
// Tidak memperhatikan teamA/teamB manual.
// =====================================================

function getAutomaticParticipant(
    round,
    matchIndex,
    side
) {

    // =============================================
    // ROUND 1
    // =============================================

    if (round === "r1") {

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
    // RONDE SEBELUMNYA
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
        previousRound,
        previousMatchIndex,
        previousMatch.winner
    );

}


// =====================================================
// GET PARTICIPANT
//
// teamA/teamB manual mempunyai prioritas.
// Jika kosong → otomatis dari ronde sebelumnya.
// =====================================================

function getParticipant(
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


    return getAutomaticParticipant(
        round,
        matchIndex,
        side
    );

}


// =====================================================
// RENDER DAFTAR PAIR ROUND 1
// =====================================================

function renderTeams() {

    teamsEl.innerHTML =
        state.teams
            .map(
                (team, index) => {

                    return `

                        <div
                            class="admin-team-row"
                        >

                            <span
                                class="admin-team-number"
                            >
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

                <div
                    class="admin-round-header"
                >

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


            const automaticA =
                getAutomaticParticipant(
                    round,
                    i,
                    "a"
                );


            const automaticB =
                getAutomaticParticipant(
                    round,
                    i,
                    "b"
                );


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

                <div
                    class="admin-match"
                >

                    <div
                        class="admin-match-title"
                    >
                        ${ROUND_NAMES[round]}
                        — Match ${i + 1}
                    </div>


                    <!-- =================================
                         PEMAIN KIRI
                    ================================== -->

                    <div
                        class="admin-score-grid"
                    >

                        <div
                            class="admin-player"
                        >

                            <input
                                type="text"
                                data-participant="${round}.${i}.teamA"
                                value="${escapeHtml(teamA)}"
                                placeholder="Nama Pair kiri"
                            >


                            <input
                                type="number"
                                min="0"
                                data-score="${round}.${i}.sa"
                                value="${escapeHtml(match.sa)}"
                                placeholder="0"
                            >

                        </div>


                        <!-- VS -->

                        <div
                            class="admin-vs"
                        >
                            VS
                        </div>


                        <!-- =================================
                             PEMAIN KANAN
                        ================================== -->

                        <div
                            class="admin-player"
                        >

                            <input
                                type="number"
                                min="0"
                                data-score="${round}.${i}.sb"
                                value="${escapeHtml(match.sb)}"
                                placeholder="0"
                            >


                            <input
                                type="text"
                                data-participant="${round}.${i}.teamB"
                                value="${escapeHtml(teamB)}"
                                placeholder="Nama Pair kanan"
                            >

                        </div>

                    </div>


                    <!-- =================================
                         INFO OTOMATIS
                    ================================== -->

                    ${
                        round !== "r1"
                        ? `

                            <div
                                class="automatic-info"
                            >
                                Otomatis:
                                ${escapeHtml(automaticA)}
                                vs
                                ${escapeHtml(automaticB)}
                            </div>

                        `
                        : ""
                    }


                    <!-- =================================
                         PEMENANG
                    ================================== -->

                    <div
                        class="admin-winner"
                    >

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
// RENDER SEMUA
// =====================================================

function render() {

    if (!titleInput) {
        return;
    }


    titleInput.value =
        state.title;


    renderTeams();

    renderMatches();

}


// =====================================================
// PESAN
// =====================================================

function showMessage(
    text,
    error = false
) {

    if (!messageEl) {
        return;
    }


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
// AMBIL NILAI INPUT
// =====================================================

function collectFormData() {

    const next =
        normalizeData(
            JSON.parse(
                JSON.stringify(state)
            )
        );


    // =============================================
    // TITLE
    // =============================================

    next.title =
        titleInput.value.trim() ||
        "Turnamen PD AMPG Banten";


    // =============================================
    // ROUND 1 TEAMS
    // =============================================

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


    // =============================================
    // SCORES
    // =============================================

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
                    input.value.trim();

            }
        );


    // =============================================
    // NAMA PESERTA
    //
    // Jika nama input sama dengan nama otomatis,
    // simpan sebagai kosong agar tetap otomatis.
    //
    // Jika berbeda → simpan manual.
    // =============================================

    document
        .querySelectorAll(
            "[data-participant]"
        )
        .forEach(
            input => {

                const [
                    round,
                    index,
                    side
                ] =
                    input.dataset
                        .participant
                        .split(".");


                const matchIndex =
                    Number(index);


                const value =
                    input.value.trim();


                const automatic =
                    getAutomaticParticipant(
                        round,
                        matchIndex,
                        side
                    );


                if (
                    round === "r1"
                ) {

                    next.matches[
                        round
                    ][
                        matchIndex
                    ][
                        side === "teamA"
                            ? "teamA"
                            : "teamB"
                    ] = "";

                    return;

                }


                const key =
                    side === "teamA"
                        ? "teamA"
                        : "teamB";


                if (
                    !value ||
                    value === automatic
                ) {

                    next.matches[
                        round
                    ][
                        matchIndex
                    ][key] = "";

                } else {

                    next.matches[
                        round
                    ][
                        matchIndex
                    ][key] = value;

                }

            }
        );


    // =============================================
    // WINNERS
    // =============================================

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
                    select.dataset
                        .winner
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


    // =============================================
    // UPDATE TIME
    // =============================================

    next.updatedAt =
        Date.now();


    return next;

}


// =====================================================
// SAVE
// =====================================================

if (saveBtn) {

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

                saveBtn.disabled = true;

                saveBtn.textContent =
                    "⏳ MENYIMPAN...";


                const next =
                    collectFormData();


                await set(
                    tournamentRef,
                    next
                );


                state =
                    normalizeData(next);


                render();


                showMessage(
                    "✓ Berhasil disimpan. Bracket publik langsung diperbarui."
                );


            } catch (error) {

                console.error(
                    "SAVE ERROR:",
                    error
                );


                showMessage(
                    "❌ Gagal menyimpan ke Firebase.",
                    true
                );

            } finally {

                saveBtn.disabled = false;

                saveBtn.textContent =
                    "💾 SIMPAN PERUBAHAN";

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

            if (!authenticated) {

                showMessage(
                    "Sesi panitia tidak aktif.",
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

                resetBtn.disabled = true;


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
                    "✓ Seluruh bracket berhasil direset."
                );


            } catch (error) {

                console.error(
                    "RESET ERROR:",
                    error
                );


                showMessage(
                    "❌ Gagal melakukan reset.",
                    true
                );

            } finally {

                resetBtn.disabled = false;

            }

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);


                window.location.href =
                    "admin.html";

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            authenticated =
                false;


            window.location.href =
                "admin.html";


            return;

        }


        authenticated =
            true;


        console.log(
            "✓ Panitia login:",
            user.email
        );


        render();

    }
);


// =====================================================
// FIREBASE REALTIME
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
            "DATABASE ERROR:",
            error
        );


        showMessage(
            "❌ Tidak dapat membaca Firebase Database.",
            true
        );

    }

);


// =====================================================
// START
// =====================================================

console.log(
    "✓ admin.js berhasil dimuat."
);
