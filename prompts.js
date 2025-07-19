// File: prompts.js

export const PROMPTS = {
  bug_analyst: `Analyze the following bug description or log and provide a structured output in this format:

- Bug Title: Clear and concise summary
- Possible Cause: Potential cause from system, UI/UX, backend, API, or database
- Steps to Reproduce: Detailed steps to reproduce the bug
- Expected Result: What should have happened
- Actual Result: What actually happened
- Impact Level: Low / Medium / High / Critical – based on user impact
- Suggested Next Step: Recommended action for QA/Dev team
`,
  scenario_priority: `Analyze the following test scenarios and determine their priority (High, Medium, Low) based on user impact, likelihood, and implementation complexity. Provide logical justification for each assessment.

Output format:
Scenario Description: Scenario summary
Priority: High / Medium / Low
Justification: Logical reason for the chosen priority based on:
- User impact
- Usage frequency
- Technical complexity / risk of failure
`,
  test_data_generator: `Generate test data based on the following scenario description. Include:
- Field Name: Name of the required field/data
- Valid Data: Example of valid data for positive testing
- Invalid Data: Example of invalid data for negative testing (error/validation)
- Edge Case Data: Example of extreme or boundary data
- Justification: Reason for using this data

Output format should be in JSON
`
};
