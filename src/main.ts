/* eslint "@typescript-eslint/indent": "off" */
/* eslint "no-tabs": "off" */
/* eslint "@typescript-eslint/no-unsafe-argument": "off" */
import { createApp } from "vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import messages from "@intlify/unplugin-vue-i18n/messages"
import PrimeVue from "primevue/config"
import "./style.css"
import agoraPresets from "./presets/agora"
import App from "./App.vue"

const pinia = createPinia()
const i18n = createI18n({
	locale: "en",
	messages
})

createApp(App).use(pinia).use(PrimeVue, { unstyled: true, pt: agoraPresets }).use(i18n).mount("#app")
