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

  // Loading spinner animation
  const spinnerFrames = ['|', '/', '-', '\\'];
  let spinnerIndex = 0;
  let spinnerActive = true;
  process.stdout.write('⏳ Processing');
  const spinner = setInterval(() => {
    process.stdout.write(`\r⏳ Processing ${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}`);
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
    // Check if response is streaming JSONL (Ollama)
    if (modelName === 'ollama') {
      // Combine all 'response' fields from each JSON line
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
        if (!result) errorMsg = 'Model did not return a valid output. Raw response:\n' + rawText;
      } catch (e) {
        errorMsg = 'Failed to parse streaming JSON from response. Raw response:\n' + rawText;
      }
    } else {
      // OpenAI: regular JSON parse
      let json;
      try {
        json = JSON.parse(rawText);
      } catch (jsonErr) {
        errorMsg = 'Failed to parse JSON from response. Raw response:\n' + rawText;
      }
      if (!errorMsg) {
        try {
          result = model.extract(json);
        } catch (e) {
          errorMsg = 'Failed to extract result from model response: ' + e + '\nRaw response: ' + JSON.stringify(json, null, 2);
        }
        if (typeof result === 'undefined' || result === null) {
          errorMsg = 'Model did not return a valid output. Raw response: ' + JSON.stringify(json, null, 2);
        }
      }
    }
  } catch (e) {
    errorMsg = 'An error occurred while processing the request: ' + e;
  }
  clearInterval(spinner);
  process.stdout.write('\r');
  spinnerActive = false;

  if (errorMsg) {
    console.log(`\n❌ Task failed: ${errorMsg}\n`);
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
  const model = await ask("Choose model (openai/ollama): ");
  let submodel = 'gemma:2b';
  if (model.trim() === 'ollama') {
    // Check and start Ollama server if not running
    if (!(await isOllamaRunning())) {
      console.log("Starting Ollama server...");
      startOllamaServer();
      const ready = await waitForOllamaReady();
      if (!ready) {
        console.error("Failed to start Ollama server. Make sure Ollama is installed and can be run from the command line.");
        process.exit(1);
      }
      console.log("Ollama server is ready!");
    } else {
      console.log("Ollama server is already running.");
    }

    // Get list of local models available in Ollama
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
      // ignore error, just continue
    }
    if (localModels.length > 0) {
      console.log("Local models available in Ollama:");
      localModels.forEach(m => console.log("- " + m));
    } else {
      console.log("Could not fetch list of local models from Ollama. Make sure the server is running and models are pulled.");
    }
    submodel = await ask("Choose Ollama local model from the list above: ");
  }
  while (true) {
    const task = await ask("Enter task name (e.g. bug_analyst, test_data_generator, scenario_priority): ");
    let inputPrompt = "Enter input description/log: \n";
    let promptInstruksi = '';
    const t = task.trim().toLowerCase();
    if (t.includes('bug')) {
      inputPrompt = "Enter bug, error, or log details to analyze:\n";
      promptInstruksi = PROMPTS.bug_analyst;
    } else if (t.includes('test_data')) {
      inputPrompt = "Enter description of required test data or scenario:\n";
      promptInstruksi = PROMPTS.test_data_generator;
    } else if (t.includes('scenario_priority') || t.includes('priority')) {
      inputPrompt = "Enter list of scenarios or requirements to prioritize:\n";
      promptInstruksi = PROMPTS.scenario_priority;
    }
    const inputTextUser = await ask(inputPrompt);
    // Combine prompt instruction with user input if special instruction exists
    const inputText = promptInstruksi ? `${promptInstruksi}\n\n${inputTextUser}` : inputTextUser;
    const success = await runAgent(model.trim(), task.trim(), inputText, submodel.trim());
    if (success) {
      // After success, continue to next task without break
      continue;
    }
    // If failed, repeat task and description input
    console.log("Please re-enter the task and description/log.");
  }
}

main();
