
<p align="center">
  <img src="img/anyany.png" alt="anyany.js logo" width="320" />
</p>

# anyany.js

CLI QA AI Agent for bug analysis, scenario prioritization, and automated test data generation. Supports OpenAI (GPT-4) and Ollama (local models such as gemma2:2b).

## Features
- Choose model: OpenAI (cloud) or Ollama (local)
- Automatic structured prompts based on task (bug, test data, scenario priority)
- Analysis results are saved in the `output/` folder
- Automatically detects and starts Ollama local model if not running
- `.env` file is never uploaded to the repository (use `.env.example`)

## Installation
1. Clone the repo:
   ```
   git clone git@github.com:modalqa/anyany.js.git
   cd anyany.js
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the required variables:
   ```
   cp .env.example .env
   # Edit .env and set your OPENAI_API_KEY if you want to use OpenAI
   ```

## Usage
Run:
```
node agent.js
```
Follow the CLI instructions:
- Choose model (openai/ollama)
- If ollama, select the local model (e.g. gemma2:2b)
- Enter the task name (bug_analyst, test_data_generator, scenario_priority)
- Enter the description/log as instructed
- The result will be saved in the `output/` folder with a filename based on the task

## Example Automatic Prompts
- **bug_analyst**: Analyze bugs with a structured format (title, cause, steps, impact, etc.)
- **scenario_priority**: Analyze scenario priorities with justification
- **test_data_generator**: Generate valid/invalid/edge case test data in JSON format

## Demo
[See video demo here](https://jam.dev/c/411cae17-759d-4ee4-80c6-34d4db8a826e)

## Notes
- The `node_modules` folder and `.env` file are never uploaded to the repo (see `.gitignore`)
- For local models, make sure Ollama is installed and the model is pulled
- For OpenAI, make sure the API key is set in `.env`

## Contribution
Pull requests and issues are welcome!

---

Copyright (c) modalqa