/**
 * Utilities for reading and comparing app version identifiers.
 * The version is embedded in the HTML meta tag and updated on each deploy.
 */

/**
 * Reads the running app version from the current document's meta tag.
 * Returns null if the meta tag is not found, has no content, or contains a placeholder.
 */
export function getRunningAppVersion(): string | null {
  const metaTag = document.querySelector('meta[name="app-version"]');
  if (!metaTag) {
    console.warn('[AppVersion] No app-version meta tag found');
    return null;
  }
  
  const content = metaTag.getAttribute('content');
  
  // Reject empty, whitespace-only, or placeholder values
  if (!content || !content.trim()) {
    console.warn('[AppVersion] app-version meta tag is empty');
    return null;
  }
  
  const trimmed = content.trim();
  
  // Reject known placeholder patterns
  if (trimmed === 'BUILD_VERSION_PLACEHOLDER' || trimmed.includes('VITE_BUILD_TIMESTAMP')) {
    console.warn('[AppVersion] app-version contains placeholder:', trimmed);
    return null;
  }
  
  return trimmed;
}

/**
 * Extracts the app version from fetched HTML text.
 * Returns null if the version meta tag cannot be found, parsed, or contains a placeholder.
 */
export function extractVersionFromHTML(html: string): string | null {
  try {
    // Use DOMParser to safely parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const metaTag = doc.querySelector('meta[name="app-version"]');
    if (!metaTag) return null;
    
    const content = metaTag.getAttribute('content');
    
    // Reject empty, whitespace-only, or placeholder values
    if (!content || !content.trim()) return null;
    
    const trimmed = content.trim();
    
    // Reject known placeholder patterns
    if (trimmed === 'BUILD_VERSION_PLACEHOLDER' || trimmed.includes('VITE_BUILD_TIMESTAMP')) {
      return null;
    }
    
    return trimmed;
  } catch (error) {
    console.error('[AppVersion] Failed to extract version from HTML:', error);
    return null;
  }
}
