import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ChallengeDeletedNoticeProps {
  open: boolean;
  onDismiss: () => void;
}

/**
 * Dismissible notice shown when a challenge has been deleted.
 * Informs the user that the challenge no longer exists and they have been disconnected.
 */
export function ChallengeDeletedNotice({ open, onDismiss }: ChallengeDeletedNoticeProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Challenge Deleted</AlertDialogTitle>
          <AlertDialogDescription>
            The challenge you were participating in has been deleted by the creator. You are no longer connected to this challenge.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
