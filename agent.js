// File: agent.js

import readline from 'readline';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { PROMPTS } from './prompts.js';
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const MODELS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    format: (input) => ({
      model: 'gpt-4',
      messages: [{ role: 'user', content: input }]
    }),
    extract: (res) => res.choices[0].message.content
  },
  ollama: {
    url: 'http://localhost:11434/api/generate',
    headers: () => ({ 'Content-Type': 'application/json' }),
    format: (input, submodel = 'gemma2:2b') => ({ model: submodel, prompt: input }),
    extract: (res) => res.response
  }
};

async function ask(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function runAgent(modelName, task, inputText, submodel) {
  const model = MODELS[modelName];
  if (!model) throw new Error(`Model ${modelName} not supported.`);

  // Spinner animasi loading
  const spinnerFrames = ['|', '/', '-', '\\'];
  let spinnerIndex = 0;
  let spinnerActive = true;
  process.stdout.write('⏳ Memproses');
  const spinner = setInterval(() => {
    process.stdout.write(`\r⏳ Memproses ${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}`);
  }, 120);

  let result, errorMsg = null, rawText = null;
  try {
    const body = JSON.stringify(
      modelName === 'ollama' ? model.format(inputText, submodel) : model.format(inputText)
    );
    const res = await fetch(model.url, {
      method: 'POST',
      headers: model.headers(model.key),
      body
    });
    rawText = await res.text();
    // Cek apakah response streaming JSONL (Ollama)
    if (modelName === 'ollama') {
      // Gabungkan semua field 'response' dari setiap baris JSON
      try {
        const lines = rawText.split(/\r?\n/).filter(Boolean);
        let combined = '';
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.response) combined += obj.response;
          } catch {}
        }
        result = combined.trim();
        if (!result) errorMsg = 'Model tidak mengembalikan output yang valid. Response mentah:\n' + rawText;
      } catch (e) {
        errorMsg = 'Gagal parsing streaming JSON dari response. Response mentah:\n' + rawText;
      }
    } else {
      // OpenAI: parse JSON biasa
      let json;
      try {
        json = JSON.parse(rawText);
      } catch (jsonErr) {
        errorMsg = 'Gagal parsing JSON dari response. Response mentah:\n' + rawText;
      }
      if (!errorMsg) {
        try {
          result = model.extract(json);
        } catch (e) {
          errorMsg = 'Gagal mengekstrak hasil dari response model: ' + e + '\nResponse mentah: ' + JSON.stringify(json, null, 2);
        }
        if (typeof result === 'undefined' || result === null) {
          errorMsg = 'Model tidak mengembalikan output yang valid. Response mentah: ' + JSON.stringify(json, null, 2);
        }
      }
    }
  } catch (e) {
    errorMsg = 'Terjadi error saat memproses request: ' + e;
  }
  clearInterval(spinner);
  process.stdout.write('\r');
  spinnerActive = false;

  if (errorMsg) {
    console.log(`\n❌ Task gagal dijalankan: ${errorMsg}\n`);
    return false;
  }
  const outputFile = `output/${task.replace(/\s+/g, '_')}.txt`;
  fs.writeFileSync(outputFile, result);
  console.log(`\n✅ Output saved to: ${outputFile}\n`);
  return true;
}

// Check if Ollama server is running
async function isOllamaRunning() {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Start Ollama server if not running
function startOllamaServer() {
  // Windows: run in background
  const proc = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore',
    shell: true
  });
  proc.unref();
}

// Wait until Ollama server is ready
async function waitForOllamaReady(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await isOllamaRunning()) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log("🔧 QA AI Agent CLI");
  const model = await ask("Pilih model (openai/ollama): ");
  let submodel = 'gemma:2b';
  if (model.trim() === 'ollama') {
    // Cek dan jalankan server Ollama jika belum aktif
    if (!(await isOllamaRunning())) {
      console.log("Menjalankan server Ollama...");
      startOllamaServer();
      const ready = await waitForOllamaReady();
      if (!ready) {
        console.error("Gagal menjalankan server Ollama. Pastikan Ollama sudah terinstall dan dapat dijalankan dari command line.");
        process.exit(1);
      }
      console.log("Server Ollama siap!");
    } else {
      console.log("Server Ollama sudah aktif.");
    }

    // Ambil daftar model lokal yang tersedia di Ollama
    let localModels = [];
    try {
      const res = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models)) {
          localModels = data.models.map(m => m.name);
        }
      }
    } catch (e) {
      // abaikan error, lanjutkan saja
    }
    if (localModels.length > 0) {
      console.log("Model lokal yang tersedia di Ollama:");
      localModels.forEach(m => console.log("- " + m));
    } else {
      console.log("Tidak dapat mengambil daftar model lokal dari Ollama. Pastikan server berjalan dan model sudah di-pull.");
    }
    submodel = await ask("Pilih model lokal Ollama sesuai daftar di atas: ");
  }
  while (true) {
    const task = await ask("Masukkan nama task (contoh: bug_analyst, test_data_generator, scenario_priority): ");
    let inputPrompt = "Masukkan input deskripsi/log: \n";
    let promptInstruksi = '';
    const t = task.trim().toLowerCase();
    if (t.includes('bug')) {
      inputPrompt = "Masukkan detail bug, error, atau log yang ingin dianalisis:\n";
      promptInstruksi = PROMPTS.bug_analyst;
    } else if (t.includes('test_data')) {
      inputPrompt = "Masukkan deskripsi kebutuhan test data atau skenario yang diinginkan:\n";
      promptInstruksi = PROMPTS.test_data_generator;
    } else if (t.includes('scenario_priority') || t.includes('priority')) {
      inputPrompt = "Masukkan daftar skenario atau requirement yang ingin diprioritaskan:\n";
      promptInstruksi = PROMPTS.scenario_priority;
    }
    const inputTextUser = await ask(inputPrompt);
    // Gabungkan instruksi prompt dengan input user jika ada instruksi khusus
    const inputText = promptInstruksi ? `${promptInstruksi}\n\n${inputTextUser}` : inputTextUser;
    const success = await runAgent(model.trim(), task.trim(), inputText, submodel.trim());
    if (success) {
      // Setelah sukses, lanjut ke task berikutnya tanpa break
      continue;
    }
    // Jika gagal, ulangi input task dan deskripsi
    console.log("Silakan masukkan ulang task dan deskripsi/log.");
  }
}

main();
