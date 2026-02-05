import { type ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-y-auto max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
