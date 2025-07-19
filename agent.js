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
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'QA AI Agent CLI'
    }),
    format: (input, submodel = 'google/gemini-2.0-flash-001') => ({
      model: submodel,
      messages: [{ role: 'user', content: input }]
    }),
    extract: (res) => res.choices[0].message.content
  }
};

// Fungsi untuk mendapatkan model yang tersedia di OpenRouter
async function getOpenRouterModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data.map(model => ({
        id: model.id,
        name: model.name,
        pricing: model.pricing
      }));
    }
    return [];
  } catch (error) {
    console.log("Could not fetch OpenRouter models:", error.message);
    return [];
  }
}

async function ask(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

// Fungsi untuk memilih dari daftar bernomor
async function selectFromList(items, prompt, defaultIndex = 0) {
  console.log(prompt);
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });
  
  const choice = await ask(`Enter number (1-${items.length}, default: ${defaultIndex + 1}): `);
  const selectedIndex = parseInt(choice.trim()) - 1;
  
  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= items.length) {
    return defaultIndex;
  }
  return selectedIndex;
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
      modelName === 'ollama' ? model.format(inputText, submodel) : model.format(inputText, submodel)
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
      // OpenAI dan OpenRouter: regular JSON parse
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
  
  // Pilih model provider dengan nomor
  const modelProviders = ['OpenAI', 'Ollama (Local)', 'OpenRouter'];
  const modelKeys = ['openai', 'ollama', 'openrouter'];
  
  const providerIndex = await selectFromList(modelProviders, "\nChoose model provider:", 0);
  const model = modelKeys[providerIndex];
  
  let submodel = '';
  
  if (model === 'ollama') {
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
      const modelIndex = await selectFromList(localModels, "\nAvailable Ollama models:", 0);
      submodel = localModels[modelIndex];
    } else {
      console.log("Could not fetch local models from Ollama. Using default.");
      submodel = 'gemma2:2b';
    }
    
  } else if (model === 'openrouter') {
    // Get OpenRouter models
    console.log("Fetching available OpenRouter models...");
    const availableModels = await getOpenRouterModels();
    
    // Daftar model populer dengan prioritas Gemini dan model ekonomis
    const popularModels = [
      { id: 'google/gemini-2.0-flash-001', desc: 'Gemini 2.0 Flash - Latest & Economic 💰' },
      { id: 'google/gemini-pro', desc: 'Gemini Pro - Reliable & Affordable 💰' },
      { id: 'google/gemini-1.5-flash', desc: 'Gemini 1.5 Flash - Fast & Cheap 💰' },
      { id: 'openai/gpt-3.5-turbo', desc: 'GPT-3.5 Turbo - Fast & Economic 💰' },
      { id: 'meta-llama/llama-3-8b-instruct', desc: 'Llama 3 8B - Open Source Budget 💰' },
      { id: 'mistralai/mistral-7b-instruct', desc: 'Mistral 7B - European Budget Model 💰' },
      { id: 'openai/gpt-4o-mini', desc: 'GPT-4o Mini - Small but Powerful 💰' },
      { id: 'openai/gpt-4o', desc: 'GPT-4o - Premium Quality 💸' },
      { id: 'meta-llama/llama-3-70b-instruct', desc: 'Llama 3 70B - Open Source Power 💸' }
    ];
    
    // Filter model yang benar-benar tersedia
    const availablePopularModels = popularModels.filter(model => 
      availableModels.some(available => available.id === model.id)
    );
    
    if (availablePopularModels.length > 0) {
      const modelDescriptions = availablePopularModels.map(m => m.desc);
      const modelIndex = await selectFromList(modelDescriptions, "\nPopular OpenRouter models (💰 = Economic, 💸 = Premium):", 0);
      submodel = availablePopularModels[modelIndex].id;
    } else {
      console.log("Could not fetch OpenRouter models. Using default Gemini.");
      submodel = 'google/gemini-2.0-flash-001';
    }
    
  } else if (model === 'openai') {
    // Model OpenAI dengan prioritas model ekonomis
    const openaiModels = [
      { id: 'gpt-3.5-turbo', desc: 'GPT-3.5 Turbo - Economic Choice 💰' },
      { id: 'gpt-4o-mini', desc: 'GPT-4o Mini - Small & Efficient 💰' },
      { id: 'gpt-4-turbo', desc: 'GPT-4 Turbo - Balanced Performance 💸' },
      { id: 'gpt-4', desc: 'GPT-4 - Most Capable 💸' }
    ];
    
    const modelDescriptions = openaiModels.map(m => m.desc);
    const modelIndex = await selectFromList(modelDescriptions, "\nAvailable OpenAI models (💰 = Economic, 💸 = Premium):", 0);
    submodel = openaiModels[modelIndex].id;
  }
  
  console.log(`\n✅ Selected: ${modelProviders[providerIndex]} - ${submodel}\n`);
  
  while (true) {
    // Pilih task dengan nomor
    const tasks = [
      { key: 'bug_analyst', name: 'Bug Analysis', prompt: PROMPTS.bug_analyst },
      { key: 'test_data_generator', name: 'Test Data Generator', prompt: PROMPTS.test_data_generator },
      { key: 'scenario_priority', name: 'Scenario Priority Analysis', prompt: PROMPTS.scenario_priority },
      { key: 'custom', name: 'Custom Task (No Special Prompt)', prompt: '' }
    ];
    
    const taskNames = tasks.map(t => t.name);
    const taskIndex = await selectFromList(taskNames, "\nChoose task type:", 0);
    const selectedTask = tasks[taskIndex];
    
    let inputPrompt = "Enter your input:\n";
    if (selectedTask.key === 'bug_analyst') {
      inputPrompt = "Enter bug, error, or log details to analyze:\n";
    } else if (selectedTask.key === 'test_data_generator') {
      inputPrompt = "Enter description of required test data or scenario:\n";
    } else if (selectedTask.key === 'scenario_priority') {
      inputPrompt = "Enter list of scenarios or requirements to prioritize:\n";
    }
    
    const inputTextUser = await ask(inputPrompt);
    // Combine prompt instruction with user input if special instruction exists
    const inputText = selectedTask.prompt ? `${selectedTask.prompt}\n\n${inputTextUser}` : inputTextUser;
    
    const success = await runAgent(model, selectedTask.key, inputText, submodel);
    if (success) {
      console.log("Task completed successfully!\n");
      const continueChoice = await ask("Continue with another task? (y/n, default: y): ");
      if (continueChoice.trim().toLowerCase() === 'n') {
        break;
      }
      continue;
    }
    // If failed, repeat task and description input
    console.log("Task failed. Please try again.\n");
  }
  
  console.log("👋 Thanks for using QA AI Agent CLI!");
  rl.close();
}

main();