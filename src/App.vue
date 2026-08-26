<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { de, en } from "@nuxt/ui/locale"
import { useI18n } from "vue-i18n"
import MapView from "./views/MapView.vue"
import LocaleSwitcher from "./components/base/LocaleSwitcher.vue"

type ThemeMode = "light" | "dark"

const { locale, t } = useI18n()
const themeMode = ref<ThemeMode>("light")
const isDarkMode = computed(() => themeMode.value === "dark")
const themeToggleLabel = computed(() => isDarkMode.value ? t("theme.switchToLight") : t("theme.switchToDark"))
const themeToggleIcon = computed(() => isDarkMode.value ? "i-lucide-sun" : "i-lucide-moon")
const uiLocale = computed(() => locale.value === "de" ? de : en)

function applyThemeMode(mode: ThemeMode): void {
    document.documentElement.classList.toggle("dark", mode === "dark")
    document.documentElement.classList.toggle("agora-dark", mode === "dark")
}

function toggleThemeMode(): void {
    themeMode.value = isDarkMode.value ? "light" : "dark"
}

onMounted(() => {
    const savedTheme = localStorage.getItem("agora-theme-mode")
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    themeMode.value = savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme
    applyThemeMode(themeMode.value)
})

watch(themeMode, (mode) => {
    applyThemeMode(mode)
    localStorage.setItem("agora-theme-mode", mode)
})
</script>

<template>
  <UApp :locale="uiLocale">
    <div class="app-container flex min-h-0 flex-col bg-default text-default font-sans">
      <header class="app-header border-b border-default bg-default text-default">
        <h1 class="app-brand">{{ t("app.title") }}</h1>
        <div class="flex items-center gap-1">
          <LocaleSwitcher />
          <UTooltip :text="themeToggleLabel">
            <UButton
              class="size-8 p-0"
              :icon="themeToggleIcon"
              color="neutral"
              variant="ghost"
              square
              :aria-label="themeToggleLabel"
              @click="toggleThemeMode"
            />
          </UTooltip>
        </div>
      </header>
      <main class="app-main">
        <MapView></MapView>
      </main>
    </div>
  </UApp>
</template>

<style scoped>
.app-container {
    width: 100%;
    height: 100%;
}
.app-header {
    height: var(--agora-app-header-height);
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0 1rem;
    z-index: 70;
}
.app-brand {
    min-width: 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
}
.app-main {
    position: relative;
    min-height: 0;
    flex: 1 1 auto;
}
</style>
