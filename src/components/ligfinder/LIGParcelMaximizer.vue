<template>
    <div>
        <Panel toggleable>
            <template #toggleicon="slotProps">
                <i v-if="slotProps.collapsed" class="pi pi-chevron-up"></i>
                <i v-else class="pi pi-chevron-down"></i>
            </template>
            <template #header>
                <span class="font-bold">{{ $t('ligfinder.filter.parcel.title') }}</span>
            </template>
            <div class="parcel-maximizer">
                <h3 class="text-lg font-semibold pb-2">{{ $t("ligfinder.filter.parcel.createHeader") }}</h3>
                <div class="filter-section">
                    <div class="attribute w-full py-1">
                        <div class="range-input flex flex-start">
                            <div class="input-group flex flex-col">
                                <label for="parcel-threshold" class="font-bold block mb-2">{{ $t(`ligfinder.filter.parcel.threshold`) }}</label>
                                <InputNumber inputId="parcel-threshold" v-model="threshold" :min="0" suffix=" m²" aria-describedby="parcel-threshold-desc"></InputNumber>
                                <span id="parcel-threshold-desc" class="sr-only">{{ $t('ligfinder.filter.parcel.thresholdDescription') }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="attribute w-full py-3">
                        <div class="input-group flex">
                            <Checkbox v-model="include" inputId="exclusion" name="exclude" binary aria-checked="include" />
                            <label for="exclusion" class="pl-1"> <span class="font-semibold">{{ $t(`ligfinder.filter.parcel.exclusion`) }}</span> <span class="italic">{{ $t(`ligfinder.filter.parcel.exclusionList`) }}</span></label>
                        </div>
                    </div>
                </div>
                <div class="py-2 flex gap-2">
                    <Button @click="getResults">{{ $t("ligfinder.filter.parcel.getResults") }}</Button>
                    <Button v-if="parcelStore.maximizedParcelsOnMap" severity="danger"
                        @click="parcelStore.cancelTempMaximizedParcels">
                        {{ $t("ligfinder.filter.parcel.clearResults") }}
                    </Button>
                </div>
                <Divider />
                <div v-if="parcelStore.maximizedParcelsOnMap" class="pt-3 flex flex-col gap-2">
                    <h3 class="text-lg font-semibold pt-4 pb-2">{{ $t("ligfinder.filter.parcel.saveHeader") }}</h3>
                    <div class="flex gap-2 items-end flex-wrap">
                        <div class="flex flex-col gap-1">
                            <label class="font-bold block mb-2" for="layerName">{{ $t("ligfinder.filter.parcel.layerName") }}</label>
                            <InputText id="layerName" v-model.trim="layerName" :minlength="3" :maxlength="35" aria-describedby="layerName-desc" />
                            <span id="layerName-desc" class="sr-only">{{ $t('ligfinder.filter.parcel.layerNameDescription') }}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-bold block mb-2" for="layerType">{{ $t("ligfinder.filter.parcel.layerType") }}</label>
                            <Select
                                id="layerType"
                                v-model="layerType"
                                :options="[
                                    { label: t('helpers.layerTypes.fill'), value: 'fill' },
                                    { label: t('helpers.layerTypes.line'), value: 'line' }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                aria-describedby="layerType-desc"
                            ></Select>
                            <span id="layerType-desc" class="sr-only">{{ $t('ligfinder.filter.parcel.layerTypeDescription') }}</span>
                        </div>
                        <Button :label="t('ligfinder.filter.parcel.saveLayer')" :disabled="layerName.trim().length < 3" @click="saveLayer"></Button>
                    </div>
                </div>
            </div>
            <div>
            </div>
        </Panel>
    </div>
</template>

<script setup lang="ts">
import Panel from "primevue/panel";
import InputNumber from "primevue/inputnumber";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import Divider from "primevue/divider";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { useParcelStore } from "../../store/ligfinder/parcel";
import { ref } from "vue";
import { useResultStore } from "../../store/ligfinder/result";
import { useToast } from "primevue/usetoast";
import { useMapStore } from "../../store/map";
import { getRandomHexColor } from "../../core/helpers/functions";
import { useI18n } from "vue-i18n";

const toast = useToast();
const parcelStore = useParcelStore();
const resultStore = useResultStore();
const mapStore = useMapStore();
const { t } = useI18n()
const include = ref<boolean>(true);
const threshold = ref<number>(0);
const layerName = ref("");
const layerType = ref<"fill" | "line">("fill");

/**
 * Validates the current filter state and threshold, and triggers the fetch
 * for maximized parcel results. Handles user error feedback with toasts.
 */
function getResults(): void {
    const overlapping = resultStore.lastAppliedFilter?.criteria.filter(c =>
        c.status === "included" &&
        typeof c.data === "object" &&
        "nutzungvalue" in c.data &&
        Array.isArray((c.data as any).nutzungvalue) &&
        parcelStore.excludedKeys.includes((c.data as any).nutzungvalue[0] as string));
    if ((overlapping != null) && overlapping.length > 0) {
        const labels = overlapping.map(c => c.label).join(", ");
        toast.add({ severity: "error", summary: t("ligfinder.filter.parcel.errors.includedConflictSummary"), detail: t("ligfinder.filter.parcel.errors.includedConflict", { labels }), life: 5000 });
        return;
    }
    if (threshold.value < 0) {
        toast.add({ severity: "warn", summary: t("ligfinder.filter.parcel.errors.thresholdInvalidSummary"), detail: t("ligfinder.filter.parcel.errors.thresholdInvalid"), life: 4000 });
        return;
    }
    if (resultStore.lastAppliedFilter === undefined) {
        toast.add({ severity: "error", summary: t("ligfinder.filter.parcel.errors.noFilterAppliedSummary"), detail: t("ligfinder.filter.parcel.errors.noFilterApplied"), life: 4000 });
        return;
    }
    parcelStore.fetchParcelMaximizationResult(resultStore.lastAppliedFilter, threshold.value, include.value)
        .then((response) => {
            try {
                parcelStore.addTempMaximizedParcels(response);
            } catch (error: any) {
                toast.add({ severity: "error", summary: t("ligfinder.filter.parcel.errors.unknownSummary"), detail: error?.message ?? t("ligfinder.filter.parcel.errors.unknown"), life: 4000 });
            }
        })
        .catch((error) => {
            toast.add({ severity: "error", summary: t("ligfinder.filter.parcel.errors.unknownSummary"), detail: error?.message ?? t("ligfinder.filter.parcel.errors.unknown"), life: 4000 });
        });
}

/**
 * Saves the currently visualized maximized parcel data as a persistent map layer.
 * Generates a random ID, collects user-provided name and type, and registers
 * the new layer and source in the map store.
 */
function saveLayer(): void {
    const geojson = parcelStore.maximizedParcelsGeoJSON;
    if (geojson == null || !Array.isArray(geojson.features) || geojson.features.length === 0) return;
    const id = `user-layer-${Math.random().toString(36).substring(2, 10)}`;
    const sourceId = `${id}-src`;

    void mapStore.addMapDataSource("geojson", sourceId, false, undefined, undefined, geojson).then(async () => {
        const style = layerType.value === "fill"
            ? { paint: { "fill-color": getRandomHexColor(), "fill-opacity": 0.3, "fill-outline-color": "#000" } }
            : { paint: { "line-color": getRandomHexColor(), "line-width": 3, "line-opacity": 1 } };

        return await mapStore.addMapLayer("geojson", id, layerType.value, style, undefined, undefined, geojson, false, layerName.value, sourceId, true);
    }).then(() => {
        toast.add({ severity: "success", summary: t("ligfinder.filter.parcel.errors.addLayerSuccessSummary"), detail: t("ligfinder.filter.parcel.errors.addLayerSuccess", { name: layerName.value }), life: 4000 });
        layerName.value = "";
    }).catch(() => {
        toast.add({ severity: "error", summary: t("ligfinder.filter.parcel.errors.addLayerFailedSummary"), detail: t("ligfinder.filter.parcel.errors.addLayerFailed"), life: 4000 });
    });
}
</script>

<style scoped></style>
