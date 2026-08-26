import { defineConfig } from "vite"
import path from "path"
import vue from "@vitejs/plugin-vue"
import ui from "@nuxt/ui/vite"
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ui(),
    VueI18nPlugin({
      include: [path.resolve(__dirname, "./src/locales/**")],
    }),
  ],
})
