/* eslint "@typescript-eslint/indent": "off" */
/* eslint "no-tabs": "off" */
/* eslint "@typescript-eslint/no-unsafe-argument": "off" */
import { createApp } from "vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import messages from "@intlify/unplugin-vue-i18n/messages"
import PrimeVue from "primevue/config"
import ToastService from "primevue/toastservice"
import Lara from "@primevue/themes/lara"
import { definePreset } from "@primevue/themes"
import "./style.css"
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

const agoraPresets = definePreset(Lara, {
	semantic: {
		primary: {
			50: "#EBECF6",
			100: "#C4C6E5",
			200: "#9CA0D4",
			300: "#757AC3",
			400: "#4D53B2",
			500: "#363273",
			600: "#3C418A",
			700: "#2B2E63",
			800: "#1A1C3B",
			900: "#090914",
			950: "#022C22",
		},
		colorScheme: {
			light: {
				surface: {
					0: "#ffffff",
					50: "{zinc.50}",
					100: "{zinc.100}",
					200: "{zinc.200}",
					300: "{zinc.300}",
					400: "{zinc.400}",
					500: "{zinc.500}",
					600: "{zinc.600}",
					700: "{zinc.700}",
					800: "{zinc.800}",
					900: "{zinc.900}",
					950: "{zinc.950}"
				}
			},
			dark: {
				surface: {
					0: "#ffffff",
					50: "{slate.50}",
					100: "{slate.100}",
					200: "{slate.200}",
					300: "{slate.300}",
					400: "{slate.400}",
					500: "{slate.500}",
					600: "{slate.600}",
					700: "{slate.700}",
					800: "{slate.800}",
					900: "{slate.900}",
					950: "{slate.950}"
				}
			}
		}
	},
	components: {
		panel: {
			colorScheme: {
				light: {
					root: {
						background: "{surface.50}"
					}
				}
			}
		},
		tag: {
			font: {
				weight: "thin"
			}
		},
		chip: {
			padding: {
				x: "0.25rem",
				y: "0.25rem"
			}
		}
	}
})

createApp(App).use(pinia).use(PrimeVue, { theme: { preset: agoraPresets, options:{ darkModeSelector: ".agora-dark" } } }).use(ToastService).use(i18n).mount("#app")
