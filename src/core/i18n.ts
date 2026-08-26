import { createI18n } from "vue-i18n"
import messages from "@intlify/unplugin-vue-i18n/messages"

export const SUPPORTED_LOCALES = ["en", "de"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_STORAGE_KEY = "agora-locale"

function isSupportedLocale(locale: string): locale is SupportedLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
}

function detectLocale(): SupportedLocale {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (storedLocale !== null && isSupportedLocale(storedLocale)) {
        return storedLocale
    }

    const browserLocale = navigator.language.split("-")[0]
    return isSupportedLocale(browserLocale) ? browserLocale : "en"
}

const initialLocale = detectLocale()
document.documentElement.lang = initialLocale

export const i18n = createI18n({
    legacy: false,
    missingWarn: false,
    fallbackLocale: "en",
    locale: initialLocale,
    messages,
})

export function setLocale(locale: SupportedLocale): void {
    i18n.global.locale.value = locale
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale
}
