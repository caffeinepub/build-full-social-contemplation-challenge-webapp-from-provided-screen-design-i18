import { useQueryClient } from '@tanstack/react-query';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { AuthButton } from './AuthButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RefreshCw } from 'lucide-react';

/**
 * Developer Panel - Currently disabled/not rendered by default.
 * Kept for potential future debugging purposes.
 * To re-enable, add <DevPanel /> to App.tsx where needed.
 */
export function DevPanel() {
  const queryClient = useQueryClient();
  const { isAuthenticated, principal } = useAuthPrincipal();

  const handleRefreshState = () => {
    queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
  };

  return (
    <Card className="m-4 border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Developer Panel (Step 0)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Auth Status:</span>
          <span className="text-xs font-mono">
            {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          </span>
        </div>
        
        {principal && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Principal:</span>
            <span className="text-xs font-mono break-all bg-muted/50 p-2 rounded">
              {principal}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <AuthButton />
          <Button
            onClick={handleRefreshState}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh State
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
