/**
 * Utilities for reading and comparing app version identifiers.
 * The version is embedded in the HTML meta tag and updated on each deploy.
 */

/**
 * Checks if a version string is a placeholder or invalid.
 */
function isPlaceholderVersion(version: string | null | undefined): boolean {
  if (!version) return true;
  
  const trimmed = version.trim();
  if (!trimmed) return true;
  
  // Known placeholder patterns
  if (
    trimmed === 'BUILD_VERSION_PLACEHOLDER' ||
    trimmed.includes('VITE_BUILD_TIMESTAMP') ||
    trimmed.includes('%VITE_') ||
    trimmed.startsWith('$')
  ) {
    return true;
  }
  
  return false;
}

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
  
  if (isPlaceholderVersion(content)) {
    console.warn('[AppVersion] app-version contains placeholder or is empty:', content);
    return null;
  }
  
  return content!.trim();
}

/**
 * Reads the raw meta tag content without validation (for diagnostics).
 */
export function getRawMetaTagContent(): string | null {
  const metaTag = document.querySelector('meta[name="app-version"]');
  if (!metaTag) return null;
  
  const content = metaTag.getAttribute('content');
  return content ? content.trim() : null;
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
    
    if (isPlaceholderVersion(content)) {
      return null;
    }
    
    return content!.trim();
  } catch (error) {
    console.error('[AppVersion] Failed to extract version from HTML:', error);
    return null;
  }
}

/**
 * Stamps the build version into the document meta tag with runtime fallback.
 * If the build version is also a placeholder, generates a unique runtime version.
 * This ensures the running version is always concrete for update checks.
 * Only stamps if the current meta tag content is missing or a placeholder.
 */
export function stampBuildVersionWithFallback(buildVersion: string): void {
  const metaTag = document.querySelector('meta[name="app-version"]');
  
  if (!metaTag) {
    console.warn('[AppVersion] No app-version meta tag found to stamp');
    return;
  }
  
  const currentContent = metaTag.getAttribute('content');
  
  // Only stamp if current content is placeholder or invalid
  if (isPlaceholderVersion(currentContent)) {
    // Check if build version is also a placeholder
    let versionToStamp = buildVersion;
    
    if (isPlaceholderVersion(buildVersion)) {
      // Generate runtime fallback version
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      versionToStamp = `${timestamp}-${random}-fallback`;
      console.warn('[AppVersion] Build version is placeholder, using runtime fallback:', versionToStamp);
    }
    
    metaTag.setAttribute('content', versionToStamp);
    console.log('[AppVersion] Stamped version into meta tag:', versionToStamp);
  } else {
    console.log('[AppVersion] Meta tag already has valid version:', currentContent);
  }
}

/**
 * Legacy function kept for compatibility - now uses fallback-aware version
 */
export function stampBuildVersion(buildVersion: string): void {
  stampBuildVersionWithFallback(buildVersion);
}

/**
 * Checks if a version string is valid (not a placeholder).
 * Exposed for DevPanel diagnostics.
 */
export function isValidVersion(version: string | null | undefined): boolean {
  return !isPlaceholderVersion(version);
}
