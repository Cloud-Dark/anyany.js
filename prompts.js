// File: prompts.js

export const PROMPTS = {
  // ===================================
  // Prompts Spesifik untuk QA & Testing
  // ===================================

  /**
   * Menganalisis deskripsi bug atau log untuk memberikan laporan terstruktur.
   */
  BUG_ANALYSIS: `Analyze the following bug description or log and provide a structured output in this format:

- Bug Title: Clear and concise summary
- Possible Cause: Potential cause from system, UI/UX, backend, API, or database
- Steps to Reproduce: Detailed steps to reproduce the bug
- Expected Result: What should have happened
- Actual Result: What actually happened
- Impact Level: Low / Medium / High / Critical – based on user impact
- Suggested Next Step: Recommended action for the QA/Dev team
`,

  /**
   * Menganalisis skenario pengujian untuk menentukan prioritasnya.
   */
  SCENARIO_PRIORITY_ANALYSIS: `Analyze the following test scenarios and determine their priority (High, Medium, Low) based on user impact, likelihood, and implementation complexity. Provide logical justification for each assessment.

Output format:
- Scenario Description: [Scenario summary]
- Priority: [High / Medium / Low]
- Justification: [Logical reason for the chosen priority based on user impact, usage frequency, and technical complexity/risk]
`,

  /**
   * Menghasilkan data uji (valid, invalid, edge case) berdasarkan deskripsi skenario.
   * Meminta output dalam format JSON.
   */
  TEST_DATA_GENERATOR: `Generate test data based on the following scenario description. The output must be a valid JSON array of objects. Each object should represent a data field and include:
- "fieldName": Name of the required field/data
- "validData": Example of valid data for positive testing
- "invalidData": Example of invalid data for negative testing (to check error/validation handling)
- "edgeCaseData": Example of data at the boundaries or extreme limits
- "justification": Brief reason for choosing this data set

Do not include any text or formatting outside of the JSON array.
`,

  /**
   * Menghasilkan test suite kontrak API berdasarkan contoh payload JSON.
   */
  API_CONTRACT_TEST: `Based on the following example JSON payload, act as a QA Automation Engineer. Your task is to generate a comprehensive API contract test suite in Markdown format.

From the JSON, first, infer the contract for each field:
1.  **Data Type:** (e.g., string, number, boolean, array, object, null).
2.  **Constraints:** (e.g., required, optional, specific format like email or UUID, possible enum values).
3.  **Potential Edge Cases:** (e.g., empty strings, 0, negative numbers, empty arrays, null values where not expected).

Then, generate two sets of test cases using Markdown tables:

### Positive Test Cases (Happy Path)
A test case with a valid payload conforming to all inferred contract rules.

### Negative Test Cases (Unhappy Path)
- A separate test for each field with the **wrong data type**.
- A separate test for each **missing required field**.
- A separate test for fields with **invalid formats or values** (e.g., bad email format).
- A separate test for any other broken constraints (e.g., strings that are too long, numbers out of range).
`,

  // ===================================
  // Prompts untuk Tujuan Umum
  // ===================================

  /**
   * Meringkas teks menjadi beberapa poin kunci.
   */
  SUMMARIZE: 'Summarize the following text into a few key points:',

  /**
   * Menerjemahkan teks ke dalam Bahasa Inggris.
   */
  TRANSLATE: 'Translate the following text to English:',

  /**
   * Melakukan review kode dengan fokus pada best practice, performa, dan potensi bug.
   */
  CODE_REVIEW: 'Act as a senior software engineer and perform a thorough code review on the following snippet. Focus on best practices, performance, security vulnerabilities, and potential bugs. Provide constructive feedback with code examples where possible.',

  // ===================================
  // Prompt Cadangan
  // ===================================

  /**
   * Digunakan ketika tidak ada prompt khusus yang dipilih. AI akan merespons berdasarkan input saja.
   */
  CUSTOM_TASK: '' // Sengaja dikosongkan untuk tugas kustom tanpa prompt dasar.
};