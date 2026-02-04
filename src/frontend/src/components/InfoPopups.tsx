import { Info } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { SharedPopup } from './SharedPopup';
import { Button } from './ui/button';

export function InfoPopups() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 pt-2">
      {/* Social Contemplation Dialog */}
      <SharedPopup
        trigger={
          <Button variant="outline" size="sm" className="flex-1">
            <Info className="w-4 h-4 mr-2" />
            {t('infoPopups.socialContemplation.trigger')}
          </Button>
        }
        title={t('infoPopups.socialContemplation.title')}
        description={t('infoPopups.socialContemplation.description')}
      >
        <div className="space-y-4 text-sm">
          <p className="leading-relaxed">
            {t('infoPopups.socialContemplation.paragraph1')}
          </p>
          <p className="leading-relaxed">
            {t('infoPopups.socialContemplation.paragraph2')}
          </p>
          <p className="leading-relaxed">
            {t('infoPopups.socialContemplation.paragraph3')}
          </p>
          <p className="leading-relaxed">
            {t('infoPopups.socialContemplation.paragraph4')}
          </p>
          <p className="leading-relaxed">
            {t('infoPopups.socialContemplation.paragraph5')}
          </p>
        </div>
      </SharedPopup>

      {/* About the Challenge Dialog */}
      <SharedPopup
        trigger={
          <Button variant="outline" size="sm" className="flex-1">
            <Info className="w-4 h-4 mr-2" />
            {t('infoPopups.aboutChallenge.trigger')}
          </Button>
        }
        title={t('infoPopups.aboutChallenge.title')}
        description={t('infoPopups.aboutChallenge.description')}
      >
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">{t('infoPopups.aboutChallenge.step1.title')}</h4>
            <p className="text-muted-foreground leading-relaxed">
              {t('infoPopups.aboutChallenge.step1.description')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('infoPopups.aboutChallenge.step2.title')}</h4>
            <p className="text-muted-foreground leading-relaxed">
              {t('infoPopups.aboutChallenge.step2.description')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('infoPopups.aboutChallenge.step3.title')}</h4>
            <p className="text-muted-foreground leading-relaxed">
              {t('infoPopups.aboutChallenge.step3.description')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('infoPopups.aboutChallenge.privacy.title')}</h4>
            <p className="text-muted-foreground leading-relaxed">
              {t('infoPopups.aboutChallenge.privacy.description')}
            </p>
          </div>
        </div>
      </SharedPopup>
    </div>
  );
}
