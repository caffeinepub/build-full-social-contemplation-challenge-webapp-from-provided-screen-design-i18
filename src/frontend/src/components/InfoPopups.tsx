import { Info } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { SharedPopup } from './SharedPopup';
import { Button } from './ui/button';
import { PopupBodySections, type Section } from './PopupBodySections';

export function InfoPopups() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 pt-2">
      {/* Social Contemplation Dialog */}
      <SharedPopup
        trigger={
          <Button variant="outline" size="sm" className="flex-1" data-info-social>
            <Info className="w-4 h-4 mr-2" />
            {t('infoPopups.socialContemplation.trigger')}
          </Button>
        }
        title={t('infoPopups.socialContemplation.title')}
        description={t('infoPopups.socialContemplation.description')}
      >
        <PopupBodySections sections={t<Section[]>('infoPopups.socialContemplation.sections')} />
      </SharedPopup>

      {/* About the Challenge Dialog */}
      <SharedPopup
        trigger={
          <Button variant="outline" size="sm" className="flex-1" data-info-challenge>
            <Info className="w-4 h-4 mr-2" />
            {t('infoPopups.aboutChallenge.trigger')}
          </Button>
        }
        title={t('infoPopups.aboutChallenge.title')}
        description={t('infoPopups.aboutChallenge.description')}
      >
        <PopupBodySections sections={t<Section[]>('infoPopups.aboutChallenge.sections')} />
      </SharedPopup>
    </div>
  );
}
