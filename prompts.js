// File: prompts.js

export const PROMPTS = {
  bug_analyst: `Analisa deskripsi bug atau log dan berikan output yang terstruktur dengan format:

- Bug Title: Ringkasan singkat dan jelas
- Possible Cause: Kemungkinan penyebab dari sisi sistem, UI/UX, backend, API, atau database
- Steps to Reproduce: Langkah-langkah terperinci untuk mereplikasi bug
- Expected Result: Apa yang seharusnya terjadi
- Actual Result: Apa yang benar-benar terjadi
- Impact Level: Low / Medium / High / Critical – berdasarkan dampak terhadap pengguna
- Suggested Next Step: Apa yang sebaiknya dilakukan oleh tim QA/Dev
`,
  scenario_priority: `Analisa skenario pengujian berikut dan tentukan prioritasnya (High, Medium, Low) berdasarkan dampaknya terhadap pengguna, kemungkinan terjadinya, dan kompleksitas implementasi. Sertakan alasan logis di setiap penilaian.

Format output:
Scenario Description: Ringkasan skenario
Priority: High / Medium / Low
Justification: Alasan logis pemilihan prioritas berdasarkan:
- Dampak ke pengguna
- Frekuensi penggunaan
- Kompleksitas teknis / resiko kegagalan
`,
  test_data_generator: `Buatkan test data berdasarkan deskripsi skenario berikut. Sertakan:
- Field Name: Nama kolom/data yang dibutuhkan
- Valid Data: Contoh data valid untuk pengujian positif
- Invalid Data: Contoh data tidak valid untuk pengujian negatif (error/validasi)
- Edge Case Data: Contoh data ekstrem atau batasan logis
- Justification: Alasan mengapa data tersebut digunakan

Format hasil dalam bentuk json
`
};
