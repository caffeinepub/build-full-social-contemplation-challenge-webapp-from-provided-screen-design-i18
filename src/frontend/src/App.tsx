import { useState, useEffect } from 'react';
import { I18nProvider } from './i18n/I18nContext';
import { useAuthPrincipal } from './hooks/useAuthPrincipal';
import { useUserChallengeStatus } from './hooks/useUserChallengeStatus';
import { QueryStateGate } from './components/QueryStateGate';
import { AppShell } from './components/AppShell';
import { ProfileCompletionGate } from './components/ProfileCompletionGate';
import { AutoInvitationRedeemGate } from './components/AutoInvitationRedeemGate';
import { ChallengeDeletedNotice } from './components/ChallengeDeletedNotice';
import { AppUpdatingNotice } from './components/AppUpdatingNotice';
import { DevPanel } from './components/DevPanel';
import { UnifiedEntryMenu } from './screens/UnifiedEntryMenu';
import { Screen3Placeholder } from './screens/Screen3Placeholder';
import { Screen4Placeholder } from './screens/Screen4Placeholder';
import Screen6InChallenge from './screens/Screen6InChallenge';
import { useGetUnifiedChallengeId } from './hooks/useQueries';
import { readAppUrlState, writeAppUrlState } from './utils/appUrlState';
import { parseInvitationFromURL, persistInvitationParams } from './utils/invitationLinks';
import { hasChallengeDeletedNotice, clearChallengeDeletedNotice } from './utils/challengeDeletedNotice';
import { useAppUpdateGuard } from './hooks/useAppUpdateGuard';
import { stampBuildVersionWithFallback } from './utils/appVersion';
import { BUILD_VERSION } from './generated/appVersion';

type AppScreen = 'menu' | 'screen3' | 'screen4' | 'screen6';

function AppContent() {
  const { isAuthenticated } = useAuthPrincipal();
  const userStatusQuery = useUserChallengeStatus();
  const { challengeId: resolvedChallengeId } = useGetUnifiedChallengeId();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDeletedNotice, setShowDeletedNotice] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  
  // Check for app updates and force refresh if needed
  const { isUpdating } = useAppUpdateGuard();

  // Stamp build version into meta tag on startup with runtime fallback (once)
  useEffect(() => {
    stampBuildVersionWithFallback(BUILD_VERSION);
  }, []);

  // Check for dev panel flag in URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const devMode = urlParams.get('dev') === 'true' || localStorage.getItem('devMode') === 'true';
    setShowDevPanel(devMode);
    
    // Persist dev mode to localStorage if set via URL
    if (urlParams.get('dev') === 'true') {
      localStorage.setItem('devMode', 'true');
    }
  }, []);

  // Persist invitation params before authentication if present
  useEffect(() => {
    const urlParams = parseInvitationFromURL();
    if (urlParams) {
      persistInvitationParams(urlParams);
    }
  }, []);

  // Check for challenge deleted notice on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated && hasChallengeDeletedNotice()) {
      setShowDeletedNotice(true);
    }
  }, [isAuthenticated]);

  // Initialize screen from URL on mount
  useEffect(() => {
    if (!isInitialized && isAuthenticated && userStatusQuery.data) {
      const urlState = readAppUrlState();
      const requestedScreen = urlState.screen as AppScreen | undefined;
      
      // Restore URL-requested screen if valid
      if (requestedScreen === 'screen6' && userStatusQuery.data.hasActiveChallenge && resolvedChallengeId !== null) {
        setCurrentScreen('screen6');
      } else if (requestedScreen === 'screen4') {
        setCurrentScreen('screen4');
      } else if (requestedScreen === 'screen3') {
        setCurrentScreen('screen3');
      } else {
        setCurrentScreen('menu');
      }
      
      setIsInitialized(true);
    }
  }, [isAuthenticated, userStatusQuery.data, resolvedChallengeId, isInitialized]);

  // Sync screen changes to URL
  useEffect(() => {
    if (isInitialized) {
      writeAppUrlState({ screen: currentScreen });
    }
  }, [currentScreen, isInitialized]);

  const handleDismissDeletedNotice = () => {
    clearChallengeDeletedNotice();
    setShowDeletedNotice(false);
    // Ensure we're on the menu screen
    setCurrentScreen('menu');
  };

  // Show updating notice if app is refreshing
  if (isUpdating) {
    return <AppUpdatingNotice />;
  }

  // Show unified entry menu when not authenticated
  if (!isAuthenticated) {
    return (
      <AppShell>
        {showDevPanel && <DevPanel />}
        <UnifiedEntryMenu />
      </AppShell>
    );
  }

  // User is authenticated - wrap with ProfileCompletionGate and AutoInvitationRedeemGate
  return (
    <AppShell>
      {showDevPanel && <DevPanel />}
      <ChallengeDeletedNotice 
        open={showDeletedNotice} 
        onDismiss={handleDismissDeletedNotice}
      />
      <ProfileCompletionGate>
        <QueryStateGate query={userStatusQuery}>
          {(userStatus) => (
            <AutoInvitationRedeemGate hasActiveChallenge={userStatus?.hasActiveChallenge || false}>
              {(() => {
                const handleNavigateToMenu = () => setCurrentScreen('menu');
                const handleNavigateToScreen4 = () => setCurrentScreen('screen4');
                const handleNavigateToScreen6 = () => setCurrentScreen('screen6');
                const handleNavigateToScreen3 = () => setCurrentScreen('screen3');
                
                const handleLeaveSuccess = () => {
                  setCurrentScreen('menu');
                };
                
                const handleDeleteSuccess = () => {
                  setCurrentScreen('menu');
                };

                const handleJoinSuccess = () => {
                  setCurrentScreen('screen6');
                };

                return (
                  <>
                    {currentScreen === 'menu' && (
                      <UnifiedEntryMenu 
                        onNavigateToCreate={handleNavigateToScreen4}
                        onNavigateToChallenge={handleNavigateToScreen6}
                        onNavigateToManage={handleNavigateToScreen4}
                      />
                    )}
                    {currentScreen === 'screen3' && (
                      <Screen3Placeholder 
                        onNavigateToScreen4={handleNavigateToScreen4}
                        onJoinSuccess={handleJoinSuccess}
                        hasInconsistentState={userStatus?.hasActiveChallenge === true && resolvedChallengeId === null}
                      />
                    )}
                    {currentScreen === 'screen4' && (
                      <Screen4Placeholder 
                        onNavigateBack={handleNavigateToMenu}
                        onLeaveSuccess={handleLeaveSuccess}
                        onDeleteSuccess={handleDeleteSuccess}
                      />
                    )}
                    {currentScreen === 'screen6' && resolvedChallengeId !== null && (
                      <Screen6InChallenge 
                        challengeId={resolvedChallengeId}
                        onNavigateToManage={handleNavigateToScreen4}
                        onNavigateBack={handleNavigateToMenu}
                      />
                    )}
                  </>
                );
              })()}
            </AutoInvitationRedeemGate>
          )}
        </QueryStateGate>
      </ProfileCompletionGate>
    </AppShell>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
