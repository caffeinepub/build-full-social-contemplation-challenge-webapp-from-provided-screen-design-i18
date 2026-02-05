import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from '../i18n/I18nContext';
import { PopupBodySections, type Section } from './PopupBodySections';

interface ChallengeDeletedNoticeProps {
  open: boolean;
  onDismiss: () => void;
}

/**
 * Dismissible notice shown when a challenge has been deleted.
 * Informs the user that the challenge no longer exists and they have been disconnected.
 */
export function ChallengeDeletedNotice({ open, onDismiss }: ChallengeDeletedNoticeProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('challengeDeleted.title')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <PopupBodySections sections={t<Section[]>('challengeDeleted.sections')} />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss}>
            {t('challengeDeleted.button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
