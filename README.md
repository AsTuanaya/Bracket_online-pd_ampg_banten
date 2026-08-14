# Bracket Online PD AMPG Banten

Sistem bracket real-time: publik melihat tanpa login, panitia login untuk mengubah peserta, skor, dan pemenang.

## Setup
1. Buat project di Firebase Console.
2. Tambahkan Web App.
3. Aktifkan Authentication > Email/Password.
4. Buat akun email/password khusus panitia.
5. Aktifkan Realtime Database.
6. Salin `firebase-config.example.js` menjadi `firebase-config.js` dan isi konfigurasi Web App.
7. Pada `database.rules.json`, ganti `PANITIA_EMAIL_ANDA` dengan email panitia.
8. Publish rules Firebase.
9. Upload semua file ke GitHub Pages.

Struktur:
index.html
styles.css
app.js
firebase-config.js
database.rules.json (untuk referensi rules)

Publik: URL GitHub Pages.
Panitia: klik Panel Panitia > login.
Perubahan: tersimpan di Firebase dan langsung tampil ke semua pengunjung.
