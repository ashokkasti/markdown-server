#!/usr/bin/env node

/**
 * This script helps with publishing the package to npm
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`Current version: ${currentVersion}`);

// Ask for new version
rl.question('Enter new version (leave empty to keep current): ', (newVersion) => {
  if (newVersion && newVersion !== currentVersion) {
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated version to ${newVersion}`);
  }

  // Run npm publish
  rl.question('Do you want to publish to npm? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        console.log('Running npm publish...');
        execSync('npm publish', { stdio: 'inherit' });
        console.log('Package published successfully!');
      } catch (error) {
        console.error('Failed to publish package:', error);
      }
    } else {
      console.log('Publish canceled.');
    }
    rl.close();
  });
});
