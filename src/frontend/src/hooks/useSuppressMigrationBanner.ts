import { useEffect } from 'react';

/**
 * Client-side hook to suppress the erroneous recurring migration banner.
 * Scans the DOM for elements containing the exact migration text and removes/hides them.
 * Also installs a MutationObserver to catch and suppress re-insertions.
 */
export function useSuppressMigrationBanner() {
  useEffect(() => {
    const migrationText = 'Migrating your project to the new structure. Hold tight — this is a one-time operation.';
    
    // Function to find and hide migration banner elements
    const suppressBanner = () => {
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element) => {
        // Check if element's text content contains the migration message
        if (element.textContent?.includes(migrationText)) {
          // Only hide if this is a leaf node or small container (not body/html)
          const tagName = element.tagName.toLowerCase();
          if (tagName !== 'body' && tagName !== 'html' && element.children.length <= 2) {
            (element as HTMLElement).style.display = 'none';
          }
        }
      });
    };
    
    // Initial suppression
    suppressBanner();
    
    // Set up MutationObserver to catch dynamically added banners
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.textContent?.includes(migrationText)) {
              element.style.display = 'none';
            }
          }
        });
      });
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);
}
