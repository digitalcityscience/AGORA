<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from "../../core/i18n"

const { locale, t } = useI18n()

const items = computed(() => SUPPORTED_LOCALES.map((code) => ({
    label: t(`locale.${code}`),
    value: code,
})))
const selectedLocale = computed({
    get: () => locale.value as SupportedLocale,
    set: (value: SupportedLocale) => { setLocale(value) },
})
</script>

<template>
  <USelect
    v-model="selectedLocale"
    :items="items"
    value-key="value"
    size="sm"
    :aria-label="t('locale.label')"
    class="w-28"
  />
</template>
