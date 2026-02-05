import { useEffect } from 'react';

/**
 * Client-side hook to suppress the erroneous recurring migration banner.
 * Uses a MutationObserver to catch and suppress dynamically inserted banners
 * without performing full-document element scans.
 */
export function useSuppressMigrationBanner() {
  useEffect(() => {
    const migrationText = 'Migrating your project to the new structure. Hold tight — this is a one-time operation.';
    
    /**
     * Check if a node contains the migration text and hide it if so.
     * Only hides leaf nodes or small containers (not body/html).
     */
    const checkAndHideNode = (node: Node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      
      const element = node as HTMLElement;
      const textContent = element.textContent || '';
      
      if (textContent.includes(migrationText)) {
        const tagName = element.tagName.toLowerCase();
        // Only hide if this is not a major container
        if (tagName !== 'body' && tagName !== 'html' && element.children.length <= 2) {
          element.style.display = 'none';
        }
      }
    };
    
    /**
     * Recursively check a node and its children for migration text.
     * Limits depth to avoid performance issues.
     */
    const checkNodeTree = (node: Node, depth: number = 0) => {
      if (depth > 5) return; // Limit recursion depth
      
      checkAndHideNode(node);
      
      // Check immediate children only
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        for (let i = 0; i < element.children.length; i++) {
          checkNodeTree(element.children[i], depth + 1);
        }
      }
    };
    
    // Initial scan of existing content (limited to direct children of body)
    if (document.body) {
      for (let i = 0; i < document.body.children.length; i++) {
        checkNodeTree(document.body.children[i]);
      }
    }
    
    // Set up MutationObserver to catch dynamically added banners
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Only check added nodes
        for (const node of Array.from(mutation.addedNodes)) {
          checkNodeTree(node);
        }
      }
    });
    
    // Observe the entire document for changes
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);
}
