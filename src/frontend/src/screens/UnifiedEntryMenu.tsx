import { useTranslation } from '../i18n/I18nContext';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { useUserChallengeStatus } from '../hooks/useUserChallengeStatus';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { InfoPopups } from '../components/InfoPopups';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import { AuthIconButton } from '../components/AuthIconButton';
import { Settings } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface UnifiedEntryMenuProps {
  onNavigateToCreate?: () => void;
  onNavigateToChallenge?: () => void;
  onNavigateToManage?: () => void;
}

export function UnifiedEntryMenu({ 
  onNavigateToCreate, 
  onNavigateToChallenge,
  onNavigateToManage 
}: UnifiedEntryMenuProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthPrincipal();
  const { login, loginStatus } = useInternetIdentity();
  const userStatusQuery = useUserChallengeStatus();

  const isLoggingIn = loginStatus === 'logging-in';
  const isLoadingStatus = isAuthenticated && userStatusQuery.isLoading;

  // Determine button state
  let buttonLabel = 'Login';
  let buttonAction = login;
  let buttonDisabled = isLoggingIn;

  if (isAuthenticated && !isLoadingStatus) {
    if (userStatusQuery.data?.hasActiveChallenge) {
      buttonLabel = 'Enjoy Challenge';
      buttonAction = onNavigateToChallenge || (() => {});
      buttonDisabled = false;
    } else {
      buttonLabel = 'Create challenge';
      buttonAction = onNavigateToCreate || (() => {});
      buttonDisabled = false;
    }
  }

  return (
    <div className="flex flex-col min-h-[600px] bg-background">
      {/* Header with theme toggle, auth icon, and gear icon */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle />
        <AuthIconButton />
        {isAuthenticated && onNavigateToManage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToManage}
            className="flex-shrink-0"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Hero Section with circular image */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-64 h-64 rounded-full overflow-hidden mb-8 shadow-2xl">
          <img 
            src="/assets/generated/entry-hero.dim_1024x1024.png" 
            alt="Social Contemplation"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          7-day
        </h1>
        <h2 className="text-2xl font-semibold text-center mb-8">
          screen time challenge
        </h2>

        {/* Primary CTA Button */}
        <Button
          onClick={buttonAction}
          disabled={buttonDisabled || isLoadingStatus}
          className="w-full max-w-xs h-12 text-base font-medium rounded-full border-2 border-[#9ACD32] bg-transparent hover:bg-[#9ACD32]/10 text-foreground"
          variant="outline"
        >
          {isLoadingStatus ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>

      {/* Info Links */}
      <div className="px-6 pb-8 space-y-3">
        <button 
          onClick={() => {
            const trigger = document.querySelector('[data-info-social]') as HTMLElement;
            trigger?.click();
          }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          About Social Contemplation
        </button>
        <button 
          onClick={() => {
            const trigger = document.querySelector('[data-info-challenge]') as HTMLElement;
            trigger?.click();
          }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          About the challenge
        </button>

        {/* Hidden popup triggers */}
        <div className="hidden">
          <InfoPopups />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026. Built with ❤️ using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
