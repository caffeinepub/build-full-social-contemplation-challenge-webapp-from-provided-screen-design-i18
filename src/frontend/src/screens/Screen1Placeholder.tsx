import { useTranslation } from '../i18n/I18nContext';
import { AuthButton } from '../components/AuthButton';
import { InfoPopups } from '../components/InfoPopups';

export function Screen1Placeholder() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t('app.tagline')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 space-y-6">
        {/* Feature Highlights */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">🤝</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('screen1.features.challenge.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('screen1.features.challenge.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">💭</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('screen1.features.reflections.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('screen1.features.reflections.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('screen1.features.progress.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('screen1.features.progress.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Info Dialogs */}
        <InfoPopups />
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-8 space-y-4">
        <div className="bg-muted/30 rounded-xl p-4 text-center space-y-3">
          <p className="text-sm font-medium">
            {t('screen1.cta.ready')}
          </p>
          <AuthButton />
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          {t('screen1.cta.consent')}
        </p>
      </div>

      {/* Footer */}
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
