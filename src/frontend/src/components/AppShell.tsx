import { useSuppressMigrationBanner } from '../hooks/useSuppressMigrationBanner';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper component with centered phone-like container,
 * mobile-first responsive padding and scrollable content area.
 * Wires the migration banner suppression hook.
 */
export function AppShell({ children }: AppShellProps) {
  // Suppress erroneous migration banner
  useSuppressMigrationBanner();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
