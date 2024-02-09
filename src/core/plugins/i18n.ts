import { createI18n } from "vue-i18n";

const messages={
    en:{
        hello:"Hello"
    },
    de:{
        hello:"Hallo"
    }
}
const i18n = createI18n({
    legacy:false,
    locale:'de',
    globalInjection:true,
    fallbackLocale:'en',
    messages
})
export default i18n;