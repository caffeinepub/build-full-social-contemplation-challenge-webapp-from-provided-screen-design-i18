/**
 * Utilities for reading and comparing app version identifiers.
 * The version is embedded in the HTML meta tag and updated on each deploy.
 */

/**
 * Reads the running app version from the current document's meta tag.
 * Returns null if the meta tag is not found or has no content.
 */
export function getRunningAppVersion(): string | null {
  const metaTag = document.querySelector('meta[name="app-version"]');
  if (!metaTag) return null;
  
  const content = metaTag.getAttribute('content');
  if (!content || content === 'BUILD_VERSION_PLACEHOLDER') return null;
  
  return content.trim();
}

/**
 * Extracts the app version from fetched HTML text.
 * Returns null if the version meta tag cannot be found or parsed.
 */
export function extractVersionFromHTML(html: string): string | null {
  try {
    // Use DOMParser to safely parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const metaTag = doc.querySelector('meta[name="app-version"]');
    if (!metaTag) return null;
    
    const content = metaTag.getAttribute('content');
    if (!content || content === 'BUILD_VERSION_PLACEHOLDER') return null;
    
    return content.trim();
  } catch (error) {
    console.error('Failed to extract version from HTML:', error);
    return null;
  }
}
