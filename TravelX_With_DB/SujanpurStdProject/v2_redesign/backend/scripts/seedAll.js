const { spawnSync } = require('child_process');
const path = require('path');

const runScript = (scriptName) => {
  const scriptPath = path.join(__dirname, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`${scriptName} failed with exit code ${result.status}`);
  }
};

const run = () => {
  try {
    runScript('seedUser.js');
    runScript('seedDestinations.js');
    console.log('All seed scripts completed successfully.');
  } catch (error) {
    console.error('Seed all failed:', error.message);
    process.exitCode = 1;
  }
};

run();
