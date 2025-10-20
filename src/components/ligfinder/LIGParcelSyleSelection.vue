<template>
    <Panel>
        <template #toggleicon="slotProps">
            <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
            <i v-else class="pi pi-chevron-down"></i>
        </template>
		<template #header>
			<span class="font-bold">{{ $t('ligfinder.styler.title')}}</span>
		</template>
        <div class="style-selector">
            <SelectButton v-model="selectedStyle" :options="options" optionLabel="name" @change="changeParcelStyle"/>
        </div>
    </Panel>
</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import SelectButton from "primevue/selectbutton";
import { type LayerStyleListItem, useMapStore } from "../../store/maplibre/map";
import { computed, ref, watch } from "vue";

const selectedStyle = ref<LayerStyleListItem>();
const mapStore = useMapStore();
const options = computed(() => {
    if (mapStore.parcelDataStyles.length >= 2) {
        return [mapStore.parcelDataStyles[0], mapStore.parcelDataStyles[1]];
    } else {
        return []
    }
});
watch(options, (newValue) => {
    if (newValue.length > 0) {
        console.log("Selected style: ", newValue[0]);
        const selected = newValue[0];
        selectedStyle.value = selected;
    }
}, { immediate: true });

function changeParcelStyle(event: { originalEvent: Event; value: any }): void {
    console.log("Selected style: ", event.value);
    const selectedStyle = event.value as LayerStyleListItem;
    const map = mapStore.map;
    if (map === undefined) return;
    const layerId = `${String(import.meta.env.VITE_PARCEL_DATASET_LAYERNAME)}`
    if (map.getLayer(layerId) !== undefined) {
        if (selectedStyle.options.paint != null && selectedStyle.options.paint !== undefined) {
            Object.entries(selectedStyle.options.paint).forEach(([prop, value]) => {
                map.setPaintProperty(layerId, prop, value);
            });
        }
        if (selectedStyle.options.layout != null && selectedStyle.options.layout !== undefined) {
            Object.entries(selectedStyle.options.layout).forEach(([prop, value]) => {
                map.setLayoutProperty(layerId, prop, value);
            });
        }
    }
}
</script>
