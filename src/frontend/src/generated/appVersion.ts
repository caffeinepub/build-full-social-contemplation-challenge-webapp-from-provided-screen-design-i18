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

export const BUILD_VERSION = 
  (envVersion && envVersion !== 'BUILD_VERSION_PLACEHOLDER' && !envVersion.includes('VITE_')) 
    ? envVersion 
    : generateRuntimeVersion();
