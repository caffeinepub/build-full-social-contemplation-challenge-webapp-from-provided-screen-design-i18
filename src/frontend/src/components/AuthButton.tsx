import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from './ui/button';

export function AuthButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isLoading = loginStatus === 'logging-in' || loginStatus === 'initializing';
  
  const buttonText = loginStatus === 'logging-in' 
    ? t('auth.loggingIn')
    : loginStatus === 'initializing'
    ? t('auth.initializing')
    : isAuthenticated 
    ? t('auth.logout')
    : t('auth.login');

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
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
      disabled={isLoading}
      variant={isAuthenticated ? 'outline' : 'default'}
      size="sm"
    >
      {buttonText}
    </Button>
  );
}
