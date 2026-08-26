<template>
    <LIGFilterSection value="geometry-filters" :title="$t('ligfinder.filter.geometry.title')">
        <div class="min-w-0 space-y-2">
            <URadioGroup
                v-model="geometryMethod"
                class="w-full"
                :items="geometryMethodItems"
                value-key="value"
                variant="card"
                orientation="horizontal"
                size="sm"
                :ui="{ fieldset: 'flex flex-wrap gap-2', item: 'min-w-0 flex-1 basis-32' }"
            />
            <LIGGeometryAdministrativeAreas />
            <LIGGeometryDrawnAreas />
            <LIGGeometryIsochroneAreas />
        </div>
    </LIGFilterSection>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import LIGFilterSection from "./LIGFilterSection.vue";
import LIGGeometryAdministrativeAreas from "./LIGGeometryAdministrativeAreas.vue";
import LIGGeometryDrawnAreas from "./LIGGeometryDrawnAreas.vue";
import LIGGeometryIsochroneAreas from "./LIGGeometryIsochroneAreas.vue";
import { useGeometryStore } from "../../store/ligfinder/geometry";
import { useMapStore } from "../../store/maplibre/map";

const geometry = useGeometryStore();
const mapStore = useMapStore();
const { t } = useI18n();
const geometryMethod = computed({
    get: () => geometry.isUnion.value,
    set: (value: "union" | "intersection") => {
        const selectedMethod = geometry.unionSelectionList.find((method) => method.value === value);
        if (selectedMethod !== undefined) geometry.isUnion = selectedMethod;
    },
});
const geometryMethodItems = computed(() => geometry.unionSelectionList.map((method) => ({
    label: t(`ligfinder.filter.geometry.methods.${method.name}`),
    value: method.value,
})));

onMounted(() => {
    if (mapStore.map.getSource("selectedAreasTempLayer") !== undefined) {
        geometry.createSelectedAreasTempLayer();
    }
});
</script>
