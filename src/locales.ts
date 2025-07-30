import { getLanguage } from 'obsidian';
import en from '../i18n/en.json';
import id from '../i18n/id.json';

const Locales = i18next.createInstance({
	lng: getLanguage(),
	fallbackLng: 'en',
	resources: {
		en: { translation: en },
		id: { translation: id }
	}
});

Locales.init();

export default Locales;