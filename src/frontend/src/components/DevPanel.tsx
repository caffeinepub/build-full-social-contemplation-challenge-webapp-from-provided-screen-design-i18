import { useQueryClient } from '@tanstack/react-query';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { AuthButton } from './AuthButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, Copy, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getRunningAppVersion, getRawMetaTagContent, isValidVersion } from '../utils/appVersion';
import { BUILD_VERSION } from '../generated/appVersion';
import { getBackendBuildIdentifier } from '../utils/backendBuildInfo';
import { useState } from 'react';

/**
 * Developer Panel - Shows authentication status, version diagnostics with mismatch detection, and debug controls.
 * Enable by adding ?dev=true to URL or setting localStorage.devMode = 'true'.
 */
export function DevPanel() {
  const queryClient = useQueryClient();
  const { isAuthenticated, principal } = useAuthPrincipal();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const runningVersion = getRunningAppVersion();
  const rawMetaContent = getRawMetaTagContent();
  const backendBuildId = getBackendBuildIdentifier();

  // Version diagnostics
  const metaTagValid = isValidVersion(rawMetaContent);
  const buildVersionValid = isValidVersion(BUILD_VERSION);
  const versionsMatch = runningVersion === BUILD_VERSION;

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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Version Diagnostics
            </span>
            {versionsMatch && metaTagValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          
          {/* Running Version (meta tag) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Running Version (meta tag):</span>
              {!metaTagValid && (
                <span className="text-xs text-yellow-600 font-medium">⚠ Invalid</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono break-all bg-muted/50 p-2 rounded flex-1">
                {rawMetaContent || '(not set)'}
              </span>
              {rawMetaContent && (
                <Button
                  onClick={() => handleCopy(rawMetaContent, 'running')}
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
            {!metaTagValid && rawMetaContent && (
              <span className="text-xs text-yellow-600">
                Contains placeholder pattern - runtime fallback may be active
              </span>
            )}
          </div>

          {/* Compiled Build Version */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Compiled Build Version:</span>
              {!buildVersionValid && (
                <span className="text-xs text-yellow-600 font-medium">⚠ Fallback</span>
              )}
            </div>
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
            {!buildVersionValid && (
              <span className="text-xs text-yellow-600">
                Runtime-generated fallback version (build stamping may have failed)
              </span>
            )}
          </div>

          {/* Version Match Status */}
          {metaTagValid && buildVersionValid && (
            <div className="flex items-center gap-2 pt-1">
              {versionsMatch ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Versions match</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-yellow-600">
                    Version mismatch - may indicate stale assets
                  </span>
                </>
              )}
            </div>
          )}

          {/* Backend Build */}
          {backendBuildId && (
            <div className="flex flex-col gap-1 pt-2 border-t border-border/30">
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
