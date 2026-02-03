import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTranslation } from '../i18n/I18nContext';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '../i18n/translations';

export function LanguageSwitcher() {
  const { language, setLanguage, direction } = useTranslation();

  const currentLanguage = AVAILABLE_LANGUAGES.find(
    (lang) => lang.code === language
  ) || AVAILABLE_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="w-4 h-4" />
          <span className="text-xs">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'} className="max-h-[400px] overflow-y-auto">
        {AVAILABLE_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as LanguageCode)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
