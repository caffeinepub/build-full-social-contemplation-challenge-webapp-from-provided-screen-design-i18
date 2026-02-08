/**
 * Build-time script to generate a unique app version identifier.
 * Combines timestamp with optional git SHA for uniqueness.
 * Exports the version as an environment variable for Vite to inject.
 * Also writes a generated TypeScript module for runtime stamping.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateAppVersion() {
  const timestamp = Date.now();
  
  // Try to get git SHA (short form)
  let gitSha = 'nogit';
  try {
    gitSha = execSync('git rev-parse --short HEAD', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch (error) {
    // Git not available or not a git repo - use random string
    gitSha = Math.random().toString(36).substring(2, 9);
  }
  
  // Format: timestamp-gitsha (e.g., 1707426123456-a1b2c3d)
  const version = `${timestamp}-${gitSha}`;
  
  console.log(`[Build] Generated app version: ${version}`);
  
  return version;
}

// Generate version
const appVersion = generateAppVersion();

// Write to .env.local for Vite to pick up
const envPath = join(__dirname, '..', '.env.local');
const envContent = `VITE_BUILD_TIMESTAMP=${appVersion}\n`;

try {
  writeFileSync(envPath, envContent, { encoding: 'utf8' });
  console.log(`[Build] Wrote version to .env.local`);
} catch (error) {
  console.error('[Build] Failed to write .env.local:', error);
  process.exit(1);
}

// Write to generated TypeScript module for runtime stamping
const generatedDir = join(__dirname, '..', 'src', 'generated');
const generatedFilePath = join(generatedDir, 'appVersion.ts');

try {
  // Ensure generated directory exists
  mkdirSync(generatedDir, { recursive: true });
  
  const tsContent = `/**
 * Generated at build time by scripts/generateAppVersion.mjs
 * DO NOT EDIT MANUALLY - This file is overwritten on every build
 */

export const BUILD_VERSION = '${appVersion}';
`;
  
  writeFileSync(generatedFilePath, tsContent, { encoding: 'utf8' });
  console.log(`[Build] Wrote version to ${generatedFilePath}`);
} catch (error) {
  console.error('[Build] Failed to write generated appVersion.ts:', error);
  process.exit(1);
}

// Also export for immediate use
process.env.VITE_BUILD_TIMESTAMP = appVersion;
