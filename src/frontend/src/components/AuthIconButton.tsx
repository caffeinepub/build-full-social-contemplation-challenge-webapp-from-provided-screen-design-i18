import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

/**
 * Compact icon-only authentication control for header rows.
 * Shows login icon when not authenticated, logout icon when authenticated.
 * Handles Internet Identity login/logout flow with proper cache clearing.
 */
export function AuthIconButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const isInitializing = loginStatus === 'idle' && !identity;

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Logout: clear identity and all cached data
      await clear();
      queryClient.clear();
    } else {
      // Login: trigger Internet Identity flow
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        // Handle edge case where user is already authenticated
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn || isInitializing}
      variant="ghost"
      size="icon"
      aria-label={isAuthenticated ? 'Logout' : 'Login'}
      className="flex-shrink-0"
    >
      {isLoggingIn || isInitializing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="w-5 h-5" />
      ) : (
        <LogIn className="w-5 h-5" />
      )}
    </Button>
  );
}
