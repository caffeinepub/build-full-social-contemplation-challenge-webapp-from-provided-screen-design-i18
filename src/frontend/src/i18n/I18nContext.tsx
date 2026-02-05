import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { translations } from './translations';

interface I18nContextType {
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Set document to English/LTR on mount
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }, []);

  const t = (key: string): string => {
    return getNestedValue(translations.en, key);
  };

  return (
    <I18nContext.Provider value={{ t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
