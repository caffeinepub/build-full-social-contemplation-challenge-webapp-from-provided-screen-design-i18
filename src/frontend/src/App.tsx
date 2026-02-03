import { useState } from 'react';
import { I18nProvider } from './i18n/I18nContext';
import { useAuthPrincipal } from './hooks/useAuthPrincipal';
import { useUserChallengeStatus } from './hooks/useUserChallengeStatus';
import { QueryStateGate } from './components/QueryStateGate';
import { AppShell } from './components/AppShell';
import { DevPanel } from './components/DevPanel';
import { Screen1Placeholder } from './screens/Screen1Placeholder';
import { Screen3Placeholder } from './screens/Screen3Placeholder';
import { Screen4Placeholder } from './screens/Screen4Placeholder';
import { Screen5ManageChallenge } from './screens/Screen5ManageChallenge';
import { Screen6InChallenge } from './screens/Screen6InChallenge';

type AppScreen = 'screen1' | 'screen3' | 'screen4' | 'screen5' | 'screen6';

function AppContent() {
  const { isAuthenticated } = useAuthPrincipal();
  const userStatusQuery = useUserChallengeStatus();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('screen1');

  // Show loading/error states while resolving auth and user state
  if (!isAuthenticated) {
    return (
      <AppShell>
        <Screen1Placeholder />
        <DevPanel />
      </AppShell>
    );
  }

  // User is authenticated - check challenge status
  return (
    <AppShell>
      <QueryStateGate query={userStatusQuery}>
        {(userStatus) => {
          // Determine the base screen based on challenge status
          let baseScreen: AppScreen = 'screen3';
          if (userStatus && userStatus.hasActiveChallenge) {
            baseScreen = 'screen5'; // Default to Manage Challenge (Step 6)
          }

          // Allow navigation between screens
          const effectiveScreen = currentScreen === 'screen4' || currentScreen === 'screen5' || currentScreen === 'screen6'
            ? currentScreen 
            : baseScreen;

          const handleNavigateToScreen4 = () => setCurrentScreen('screen4');
          const handleNavigateToScreen5 = () => setCurrentScreen('screen5');
          const handleNavigateToScreen6 = () => setCurrentScreen('screen6');
          
          const handleNavigateBackFromScreen4 = () => {
            setCurrentScreen(baseScreen);
          };
          
          const handleLeaveSuccess = () => {
            setCurrentScreen('screen3');
          };
          
          const handleDeleteSuccess = () => {
            setCurrentScreen('screen3');
          };

          return (
            <>
              {effectiveScreen === 'screen3' && (
                <Screen3Placeholder 
                  onNavigateToScreen4={handleNavigateToScreen4}
                />
              )}
              {effectiveScreen === 'screen4' && (
                <Screen4Placeholder 
                  onNavigateBack={handleNavigateBackFromScreen4}
                  onLeaveSuccess={handleLeaveSuccess}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              )}
              {effectiveScreen === 'screen5' && (
                <Screen5ManageChallenge 
                  onClose={handleNavigateToScreen6}
                  onLeaveSuccess={handleLeaveSuccess}
                />
              )}
              {effectiveScreen === 'screen6' && (
                <Screen6InChallenge 
                  onNavigateToManage={handleNavigateToScreen5}
                />
              )}
              <DevPanel />
            </>
          );
        }}
      </QueryStateGate>
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
