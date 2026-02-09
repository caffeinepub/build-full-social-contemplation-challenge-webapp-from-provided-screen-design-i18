/**
 * Generated at build time by scripts/generateAppVersion.mjs
 * DO NOT EDIT MANUALLY - This file is overwritten on every build
 */

// Use Vite env variable if available, otherwise generate runtime fallback
const envVersion = import.meta.env.VITE_BUILD_TIMESTAMP;

function generateRuntimeVersion(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}-runtime`;
}

function isPlaceholder(version: string | undefined): boolean {
  if (!version) return true;
  if (version === 'BUILD_VERSION_PLACEHOLDER') return true;
  if (version.includes('VITE_BUILD_TIMESTAMP')) return true;
  if (version.includes('%VITE_')) return true;
  if (version.startsWith('$')) return true;
  return false;
}

export const BUILD_VERSION = 
  (!isPlaceholder(envVersion)) 
    ? envVersion 
    : generateRuntimeVersion();
