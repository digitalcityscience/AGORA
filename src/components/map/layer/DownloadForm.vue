<template>
    <UCard
        v-if="props.layerData !== null"
        variant="subtle"
        :ui="{ header: 'p-3 pb-2', body: 'p-3 pt-1' }"
    >
        <template #header>
            <div class="space-y-1">
                <div class="font-semibold text-highlighted">{{ $t('download.title') }}</div>
                <div class="text-sm text-muted">{{ $t('download.subtitle') }}</div>
            </div>
        </template>
        <div class="flex w-full flex-col gap-2">
            <UFieldGroup class="w-full">
                <UInput
                    v-model="fileName"
                    class="min-w-0 flex-1"
                    type="text"
                    :placeholder="$t('download.fileName')"
                />
                <USelect
                    v-model="format"
                    class="w-28"
                    :items="formatOptions"
                    :aria-label="$t('download.format')"
                />
            </UFieldGroup>
            <UButton
                block
                icon="i-lucide-download"
                :disabled="fileName.length === 0"
                :label="$t('download.download')"
                @click="downloadLayer"
            />
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { type FeatureCollection } from "geojson";
import { downloadCSVFromGeoJSON, downloadAsGeojson } from "../../../core/helpers/functions";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
interface Props {
    layerData: FeatureCollection | null
}
const props = withDefaults(defineProps<Props>(), {
    layerData: null
})
const { t } = useI18n()
const fileName = ref<string>("")
const format = ref<"csv" | "geojson">("csv")
const formatOptions = computed(() => [
    { label: t("download.downloadCSV"), value: "csv" },
    { label: t("download.downloadGeoJSON"), value: "geojson" },
])

function downloadLayer(): void {
    if (props.layerData === null || fileName.value.length === 0) return
    if (format.value === "csv") {
        downloadCSVFromGeoJSON(props.layerData, fileName.value)
    } else {
        downloadAsGeojson(props.layerData, fileName.value)
    }
}
</script>

<style scoped></style>
