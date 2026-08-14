import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    firebaseConfig
} from "./firebase-config.js";


/* =========================================================
   FIREBASE
========================================================= */

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


/* =========================================================
   ELEMENT
========================================================= */

const email =
    document.getElementById(
        "email"
    );


const password =
    document.getElementById(
        "password"
    );


const loginBtn =
    document.getElementById(
        "loginBtn"
    );


const errorBox =
    document.getElementById(
        "error"
    );


/* =========================================================
   LOGIN
========================================================= */

loginBtn.addEventListener(
    "click",
    async () => {

        const emailValue =
            email.value.trim();


        const passwordValue =
            password.value;


        errorBox.textContent = "";


        if (
            !emailValue ||
            !passwordValue
        ) {

            errorBox.textContent =
                "Email dan password wajib diisi.";

            return;

        }


        loginBtn.disabled = true;

        loginBtn.innerHTML =
            "⏳ Memproses login...";


        try {

            await signInWithEmailAndPassword(
                auth,
                emailValue,
                passwordValue
            );


            window.location.href =
                "admin-panel.html";


        }

        catch (error) {

            console.error(
                error
            );


            let message =
                "Login gagal.";


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message =
                    "Email atau password salah.";

            }


            if (
                error.code ===
                "auth/invalid-email"
            ) {

                message =
                    "Format email tidak valid.";

            }


            if (
                error.code ===
                "auth/user-not-found"
            ) {

                message =
                    "Akun panitia tidak ditemukan.";

            }


            if (
                error.code ===
                "auth/wrong-password"
            ) {

                message =
                    "Password salah.";

            }


            errorBox.textContent =
                message;


            loginBtn.disabled =
                false;


            loginBtn.innerHTML =
                "🔑 Masuk ke Panel Panitia";

        }

    }
);


/* =========================================================
   ENTER KEY
========================================================= */

password.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            loginBtn.click();

        }

    }
);
