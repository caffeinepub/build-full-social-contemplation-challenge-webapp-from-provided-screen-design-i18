import { useTranslation } from '../i18n/I18nContext';
import { InfoPopups } from '../components/InfoPopups';
import { Button } from '../components/ui/button';
import { Settings } from 'lucide-react';

interface Screen5PlaceholderProps {
  onNavigateToEdit?: () => void;
}

export function Screen5Placeholder({ onNavigateToEdit }: Screen5PlaceholderProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';

  return (
    <div className="p-6 space-y-4">
      <div className="text-center space-y-2">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h1 className="text-2xl font-bold flex-1">{t('screen5.title')}</h1>
          {onNavigateToEdit && (
            <Button
              onClick={onNavigateToEdit}
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
            >
              <Settings className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('screen5.edit')}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {t('screen5.subtitle')}
        </p>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          <strong>{t('screen5.state')}</strong> {t('screen5.stateValue')}
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>{t('screen5.next')}</strong> {t('screen5.nextValue')}
        </p>
      </div>

      {/* Info Dialogs */}
      <InfoPopups />

      <div className="text-xs text-muted-foreground/60 text-center pt-4">
        {t('screen5.placeholder')}
      </div>
    </div>
  );
}
