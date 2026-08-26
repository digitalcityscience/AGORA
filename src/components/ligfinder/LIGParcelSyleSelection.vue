<template>
    <UCard
        class="min-w-0 w-full"
        variant="subtle"
        :ui="{ header: 'p-3 pb-2', body: 'p-3 pt-1' }"
    >
        <template #header>
            <div class="text-sm font-semibold text-highlighted">{{ $t("ligfinder.styler.title") }}</div>
        </template>
        <URadioGroup
            v-model="selectedStyleName"
            class="w-full"
            :items="styleOptions"
            value-key="value"
            variant="card"
            orientation="horizontal"
            size="sm"
            :ui="{ fieldset: 'flex flex-wrap gap-2', item: 'min-w-0 flex-1 basis-32' }"
        />
    </UCard>
</template>

<script setup lang="ts">
import { computed, ref, toRaw, watch } from "vue";
import { useMapStore } from "../../store/maplibre/map";

const mapStore = useMapStore();
const availableStyles = computed(() => mapStore.parcelDataStyles.filter((style) => style.type === "fill" && style.options?.paint != null));
const styleOptions = computed(() => availableStyles.value.map((style) => ({
    label: style.name,
    value: style.name,
})));
const selectedStyleName = ref("");

watch(availableStyles, (styles) => {
    if (styles.length > 0 && !styles.some((style) => style.name === selectedStyleName.value)) {
        selectedStyleName.value = styles[0].name;
    }
}, { immediate: true });

watch(selectedStyleName, (name) => {
    const selectedStyle = availableStyles.value.find((style) => style.name === name);
    if (selectedStyle === undefined) return;
    const map = toRaw(mapStore.map);
    if (map === undefined) return;
    const layerId = String(import.meta.env.VITE_PARCEL_DATASET_LAYERNAME);
    if (map.getLayer(layerId) === undefined) return;
    if (selectedStyle.options.paint != null) {
        Object.entries(selectedStyle.options.paint).forEach(([property, value]) => {
            map.setPaintProperty(layerId, property, JSON.parse(JSON.stringify(value)));
        });
    }
    if (selectedStyle.options.layout != null) {
        Object.entries(selectedStyle.options.layout).forEach(([property, value]) => {
            map.setLayoutProperty(layerId, property, JSON.parse(JSON.stringify(value)));
        });
    }
    map.triggerRepaint();
});
</script>
