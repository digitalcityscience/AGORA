/* eslint "@typescript-eslint/indent": "off" */
/* eslint "no-tabs": "off" */
/* eslint "@typescript-eslint/no-unsafe-argument": "off" */
import { createApp } from "vue"
import { createPinia } from "pinia"
import { createRouter, createWebHistory } from "vue-router"
import ui from "@nuxt/ui/vue-plugin"
import "./style.css"
import App from "./App.vue"
import "@material-design-icons/font";
import { i18n } from "./core/i18n"

const pinia = createPinia()
const router = createRouter({
	history: createWebHistory(),
	routes: [{
		path: "/:pathMatch(.*)*",
		component: { render: () => null },
	}],
})

createApp(App)
	.use(pinia)
	.use(router)
	.use(ui)
	.use(i18n)
	.mount("#app")
