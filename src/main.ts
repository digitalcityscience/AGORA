/* eslint "@typescript-eslint/indent": "off" */
/* eslint "no-tabs": "off" */
/* eslint "@typescript-eslint/no-unsafe-argument": "off" */
import { createApp } from "vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import messages from "@intlify/unplugin-vue-i18n/messages"
import PrimeVue from "primevue/config"
import ToastService from "primevue/toastservice"
import "./style.css"
import agoraPresets from "./presets/agora"
import App from "./App.vue"
import "@material-design-icons/font";

const pinia = createPinia()

// Get the browser language
const browserLanguage = navigator.language.split("-")[0]; // This will extract "en" from "en-US"
// Set locale based on the browser language
const locale = browserLanguage === "de" ? "de" : "en";

const i18n = createI18n({
	legacy:false,
	missingWarn: false,
	locale,
	messages
})

createApp(App).use(pinia).use(PrimeVue, { unstyled: true, pt: agoraPresets }).use(ToastService).use(i18n).mount("#app")
