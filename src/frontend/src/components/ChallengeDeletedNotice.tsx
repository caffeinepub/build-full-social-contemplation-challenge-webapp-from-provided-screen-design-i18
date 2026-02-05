import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '../i18n/I18nContext';
import { PopupBodySections, type Section } from './PopupBodySections';

interface ChallengeDeletedNoticeProps {
  open: boolean;
  onDismiss: () => void;
}

/**
 * Dismissible notice shown when a challenge has been deleted with scrollable content area for longer text.
 */
export function ChallengeDeletedNotice({ open, onDismiss }: ChallengeDeletedNoticeProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[90vw] w-full sm:max-w-2xl max-h-[85vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('challengeDeleted.title')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="sr-only">Challenge deleted notice</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <PopupBodySections sections={t<Section[]>('challengeDeleted.sections')} />
          </div>
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss}>
            {t('challengeDeleted.button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
