import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';

interface Translation {
  [key: string]: string | { [key: string]: string };
}

interface I18nStore {
  currentLanguage: Language;
  translations: Record<Language, Translation>;
  setLanguage: (lang: Language) => void;
  addTranslations: (lang: Language, translations: Translation) => void;
}

const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      currentLanguage: 'ar',
      translations: {
        ar: {},
        en: {},
      },
      setLanguage: (lang) => set({ currentLanguage: lang }),
      addTranslations: (lang, translations) =>
        set((state) => ({
          translations: {
            ...state.translations,
            [lang]: {
              ...state.translations[lang],
              ...translations,
            },
          },
        })),
    }),
    {
      name: 'i18n-storage',
    }
  )
);

export class I18nManager {
  private static instance: I18nManager;
  private numberFormatter: Intl.NumberFormat;
  private dateFormatter: Intl.DateTimeFormat;
  private currencyFormatter: Intl.NumberFormat;

  private constructor() {
    this.updateFormatters(useI18nStore.getState().currentLanguage);
    useI18nStore.subscribe(
      (state) => state.currentLanguage,
      this.updateFormatters.bind(this)
    );
  }

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  private updateFormatters(language: Language): void {
    const locale = language === 'ar' ? 'ar-IQ' : 'en-US';
    
    this.numberFormatter = new Intl.NumberFormat(locale);
    
    this.dateFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    this.currencyFormatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IQD'
    });
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const { currentLanguage, translations } = useI18nStore.getState();
    let translation = this.getNestedValue(translations[currentLanguage], key);

    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    if (params) {
      translation = Object.entries(params).reduce(
        (str, [key, value]) => str.replace(`{${key}}`, String(value)),
        translation
      );
    }

    return translation;
  }

  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) as string;
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  formatDate(date: Date | number): string {
    return this.dateFormatter.format(date);
  }

  formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }

  getCurrentLanguage(): Language {
    return useI18nStore.getState().currentLanguage;
  }

  setLanguage(language: Language): void {
    useI18nStore.getState().setLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }

  addTranslations(language: Language, translations: Translation): void {
    useI18nStore.getState().addTranslations(language, translations);
  }
}

// هوك مخصص لاستخدام الترجمة
export function useI18n() {
  const manager = I18nManager.getInstance();
  const { currentLanguage } = useI18nStore();

  return {
    t: (key: string, params?: Record<string, string | number>) =>
      manager.translate(key, params),
    formatNumber: (value: number) => manager.formatNumber(value),
    formatDate: (date: Date | number) => manager.formatDate(date),
    formatCurrency: (amount: number) => manager.formatCurrency(amount),
    currentLanguage,
    setLanguage: (lang: Language) => manager.setLanguage(lang),
    addTranslations: (lang: Language, translations: Translation) =>
      manager.addTranslations(lang, translations),
  };
}