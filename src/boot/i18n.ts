import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
import { watch } from 'vue';

import messages from 'src/i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {}
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export default defineBoot(async ({ app }) => {
  const localeCandidate = window.appAPI?.getLocale
    ? await window.appAPI.getLocale()
    : 'en-US';

  const supportedLocales = Object.keys(messages);
  const locale = supportedLocales.includes(localeCandidate)
    ? localeCandidate
    : 'en-US';

  const i18n = createI18n({
    locale,
    fallbackLocale: 'en-US',
    legacy: false,
    messages,
  });

  if (window.appAPI?.getLocale !== undefined) {
    watch(i18n.global.locale, (value, oldValue) => {
      if (oldValue !== value) {
        window.appAPI.setLocale(value);
      }
    });
  }

  app.use(i18n);
});
