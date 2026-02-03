import { type UseQueryResult } from '@tanstack/react-query';
import { Button } from './ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';

interface QueryStateGateProps<T> {
  query: UseQueryResult<T>;
  children: (data: T | undefined) => React.ReactNode;
}

export function QueryStateGate<T>({ query, children }: QueryStateGateProps<T>) {
  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage = sanitizeErrorMessage(error);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Failed to load data</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {errorMessage}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return <>{children(data)}</>;
}
