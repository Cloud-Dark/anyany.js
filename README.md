# Enhanced QA AI Agent CLI

Versi 3.0: Sebuah CLI canggih yang ditenagai GenAI, dirancang untuk interaksi dinamis dengan berbagai model AI. Kini dilengkapi dengan sistem multi-agen, manajemen sesi yang persisten, mode pemrosesan batch, dan opsi ekspor yang serbaguna.

## ✨ Fitur Utama

-   **🎯 Multi-Model & Multi-Provider**: Terhubung secara mulus dengan berbagai penyedia AI:
    -   **OpenAI** (Model GPT-4o, GPT-4 Turbo, dll.)
    -   **OpenRouter** (Akses ke model Google Gemini, Meta Llama, Mistral, dll.)
    -   **Ollama** (Jalankan model secara lokal seperti Llama 3, Gemma 2, dll.)

-   **🤖 Sistem Multi-Agen Tingkat Lanjut**: Manfaatkan kekuatan kolaborasi AI dengan beberapa mode:
    -   **Debate Mode**: Dua atau lebih agen berdebat untuk memberikan perspektif yang beragam pada sebuah topik.
    -   **Pipeline Mode**: Hasil dari satu agen menjadi input untuk agen berikutnya, menyempurnakan respons secara bertahap.
    -   **Consensus Mode**: Beberapa agen memberikan jawaban secara independen, dan hasilnya disintesis menjadi satu respons yang komprehensif.

-   **💾 Manajemen Sesi yang Persisten**: Jangan pernah kehilangan jejak pekerjaan Anda.
    -   Sesi disimpan secara otomatis.
    -   Muat sesi sebelumnya untuk melanjutkan percakapan atau meninjau riwayat.
    -   Lihat, kelola, dan hapus sesi melalui menu interaktif.

-   **⚡ Pemrosesan Batch yang Kuat**: Otomatiskan tugas-tugas berulang dengan efisien.
    -   **Pemrosesan File**: Jalankan tugas yang sama untuk banyak *query* dari file `.txt` atau `.json`.
    -   **Perbandingan Model**: Uji satu *query* yang sama di berbagai model AI untuk membandingkan kinerja dan hasilnya.

-   **⚙️ Tugas Kustom yang Fleksibel**: Gunakan *template* prompt yang sudah ada atau buat sendiri.
    -   Manfaatkan prompt bawaan untuk tugas seperti `bug_analyst`, `test_data_generator`, dan `scenario_priority`.
    -   Tambahkan instruksi kustom saat runtime untuk menyesuaikan tugas dengan kebutuhan spesifik Anda.

-   **📊 Opsi Ekspor yang Serbaguna**: Simpan hasil Anda dalam format yang Anda butuhkan.
    -   Ekspor ke **Plain Text (.txt)**, **Markdown (.md)**, atau **JSON (.json)**.
    -   Hasilkan laporan **HTML (.html)** yang rapi dan bergaya, dengan konversi Markdown yang sudah ditingkatkan.

-   **🏠 Integrasi Ollama yang Dinamis**: Secara otomatis mendeteksi model Ollama yang terinstal di sistem lokal Anda.

## Pemasangan

1.  **Clone repositori:**
    ```bash
    git clone git@github.com:modalqa/anyany.js.git
    cd anyany.js
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **(Opsional) Instal `showdown` untuk ekspor HTML yang lebih baik:**
    ```bash
    npm install showdown
    ```

4.  **Salin `.env.example` ke `.env` dan isi variabel yang diperlukan:**
    ```bash
    cp .env.example .env
    ```
    Kemudian, edit file `.env` dan masukkan API key Anda.

## Konfigurasi

Buka file `.env` dan atur API key Anda. Anda hanya perlu mengisi *key* untuk layanan yang ingin Anda gunakan.

```env
# Diperlukan untuk model OpenAI
OPENAI_API_KEY="sk-..."

# Diperlukan untuk mengakses model Gemini, Llama, dll. melalui OpenRouter
OPENROUTER_API_KEY="sk-or-..."
```

## Penggunaan

Jalankan aplikasi dari terminal:

```bash
node agent.js
```

Anda akan disambut dengan menu utama interaktif. Cukup pilih opsi yang Anda inginkan:

-   **`🔥 Quick Query`**: Untuk pertanyaan tunggal yang cepat ke model AI pilihan Anda.
-   **`🤖 Multi-Agent Mode`**: Untuk menggunakan mode kolaboratif (Debate, Pipeline, Consensus).
-   **`⚙️  Custom Task`**: Untuk menggunakan *template* prompt yang telah ditentukan (misalnya, analisis bug).
-   **`💾 Session Management`**: Untuk melihat, memuat, membuat, atau menghapus sesi percakapan Anda.
-   **`⚡ Batch Processing`**: Untuk memproses banyak *query* dari file atau membandingkan model.
-   **`❌ Exit`**: Untuk keluar dari aplikasi.

Hasilnya dapat ditampilkan di terminal atau diekspor ke file di dalam folder `output/`.

## Contoh Kasus Penggunaan

### Analisis Bug dengan Mode Pipeline
Gunakan **Multi-Agent Mode -> Pipeline**.
-   **Agen 1 (GPT-4o)**: Menganalisis log error untuk mengidentifikasi kemungkinan penyebab.
-   **Agen 2 (Llama 3 70B)**: Mengambil analisis dari Agen 1 dan menulis langkah-langkah reproduksi yang detail.
-   **Agen 3 (Gemini 1.5 Flash)**: Mengambil langkah-langkah reproduksi dan membuat ringkasan dampak bisnis serta saran perbaikan.

### Membuat Data Uji
Gunakan **Custom Task -> test_data_generator**. Masukkan deskripsi tentang data apa yang Anda butuhkan, dan AI akan menghasilkan data dalam format JSON yang mencakup kasus valid, tidak valid, dan kasus tepi (*edge cases*).

### Perbandingan Model
Gunakan **Batch Processing -> Repeat Query with Different Models**. Masukkan satu pertanyaan, misalnya "Jelaskan perbedaan utama antara Playwright dan Cypress", dan skrip akan mengirimkannya ke semua provider yang terkonfigurasi, lalu menyajikan laporan perbandingan.

## Demo

<p align="center">
  <img src="img/anyany.png" alt="anyany.js CLI in action" width="600" />
</p>

*Catatan: Gambar di atas mungkin tidak mencerminkan semua fitur terbaru.*

## Kontribusi

*Pull request* dan *issue* sangat diterima! Jangan ragu untuk berkontribusi.

---

Copyright (c) modalqa