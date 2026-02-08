import { useQueryClient } from '@tanstack/react-query';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { AuthButton } from './AuthButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { getRunningAppVersion } from '../utils/appVersion';
import { BUILD_VERSION } from '../generated/appVersion';
import { getBackendBuildIdentifier } from '../utils/backendBuildInfo';
import { useState } from 'react';

/**
 * Developer Panel - Shows authentication status, version diagnostics, and debug controls.
 * Enable by adding ?dev=true to URL or setting localStorage.devMode = 'true'.
 */
export function DevPanel() {
  const queryClient = useQueryClient();
  const { isAuthenticated, principal } = useAuthPrincipal();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const runningVersion = getRunningAppVersion();
  const backendBuildId = getBackendBuildIdentifier();

  const handleRefreshState = () => {
    queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="m-4 border-accent/20 bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Developer Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Authentication Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Auth Status:</span>
          <span className="text-xs font-mono">
            {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          </span>
        </div>
        
        {principal && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Principal:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono break-all bg-muted/50 p-2 rounded flex-1">
                {principal}
              </span>
              <Button
                onClick={() => handleCopy(principal, 'principal')}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {copiedField === 'principal' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Version Diagnostics */}
        <div className="border-t border-border/50 pt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Version Diagnostics
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Running Version (meta tag):</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono break-all bg-muted/50 p-2 rounded flex-1">
                {runningVersion || '(not set)'}
              </span>
              {runningVersion && (
                <Button
                  onClick={() => handleCopy(runningVersion, 'running')}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {copiedField === 'running' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Compiled Build Version:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono break-all bg-muted/50 p-2 rounded flex-1">
                {BUILD_VERSION}
              </span>
              <Button
                onClick={() => handleCopy(BUILD_VERSION, 'build')}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {copiedField === 'build' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {backendBuildId && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Backend Build:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono break-all bg-muted/50 p-2 rounded flex-1">
                  {backendBuildId}
                </span>
                <Button
                  onClick={() => handleCopy(backendBuildId, 'backend')}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {copiedField === 'backend' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
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
