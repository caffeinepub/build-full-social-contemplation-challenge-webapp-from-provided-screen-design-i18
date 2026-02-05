import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Notice component displayed when the app detects a version mismatch
 * and is about to force-refresh to the latest version.
 */
export function AppUpdatingNotice() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-[90%] max-w-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Updating App</h3>
              <p className="text-sm text-muted-foreground">
                Loading the latest version...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
