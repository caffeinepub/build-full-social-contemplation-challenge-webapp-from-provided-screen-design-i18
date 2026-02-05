import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useTranslation } from '../i18n/I18nContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Loader2, User } from 'lucide-react';

interface ProfileCompletionGateProps {
  children: React.ReactNode;
}

export function ProfileCompletionGate({ children }: ProfileCompletionGateProps) {
  const { t } = useTranslation();
  
  const profileQuery = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();
  
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if profile name is missing or empty
  const needsProfileCompletion = 
    profileQuery.isFetched && 
    (profileQuery.data === null || 
     profileQuery.data === undefined || 
     !profileQuery.data.name || 
     profileQuery.data.name.trim() === '');

  // Reset form when profile is loaded
  useEffect(() => {
    if (profileQuery.data?.name) {
      setName(profileQuery.data.name);
    }
  }, [profileQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({ name: trimmedName });
      // Profile query will be invalidated automatically by the mutation
      // and the gate will unblock once the new profile is fetched
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    }
  };

  // Show loading state while checking profile
  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show profile completion form if needed
  if (needsProfileCompletion) {
    return (
      <div className="flex flex-col min-h-[600px]">
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              {t('app.title')}
            </h1>
            <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Welcome! Let's get you started.
            </p>
          </div>
        </div>

        <div className="flex-1 px-6 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Please enter your name to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">
                    Your Name
                  </Label>
                  <Input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={saveProfileMutation.isPending}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saveProfileMutation.isPending || !name.trim()}
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            {t('screen1.footer').split('caffeine.ai')[0]}
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

  // Profile is complete, render children
  return <>{children}</>;
}
