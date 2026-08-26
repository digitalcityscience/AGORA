<template>
    <BaseSlideoverSidebarComponent
        :id="sidebarID"
        side="right"
        :collapsed="true"
        width-class="w-[min(50rem,44vw)]"
    >
        <template #header>
            <span>{{ $t("ligfinder.table.title") }}</span>
        </template>

        <UCard
            class="min-w-0"
            :ui="{
                body: 'min-w-0 p-3 sm:p-4',
                footer: 'p-3 sm:p-4',
            }"
        >
            <LIGResultTableView
                v-if="hasResults"
                show-expand
                @expand="isFullScreen = true"
                @focus="focusOnSelectedParcel"
                @zoom="zoomToResults"
            />
            <UAlert
                v-else
                color="info"
                variant="subtle"
                :title="$t(resultStore.isFilterApplied ? 'ligfinder.table.noResults' : 'ligfinder.table.noFilter')"
            />

            <template v-if="hasResults" #footer>
                <div class="grid min-w-0 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
                    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <UInput
                            v-model="layerName"
                            class="min-w-0"
                            :placeholder="$t('ligfinder.table.layerName')"
                        />
                        <UButton
                            :label="$t('ligfinder.table.add')"
                            :disabled="layerName.trim().length === 0"
                            @click="addAsLayer"
                        />
                    </div>

                    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <UFieldGroup class="min-w-0 w-full">
                            <UInput
                                v-model="fileName"
                                class="min-w-0 flex-1"
                                :placeholder="$t('ligfinder.table.fileName')"
                            />
                            <USelect
                                v-model="downloadFormat"
                                :items="downloadFormatOptions"
                                value-key="value"
                                class="w-24 shrink-0"
                                :aria-label="$t('ligfinder.table.downloadFormat')"
                            />
                        </UFieldGroup>
                        <UButton
                            :label="$t('ligfinder.table.download')"
                            :disabled="fileName.trim().length === 0"
                            @click="downloadResults"
                        />
                    </div>
                </div>
            </template>
        </UCard>

        <UModal
            v-model:open="isFullScreen"
            fullscreen
            :title="$t('ligfinder.table.title')"
            :ui="{
                body: 'min-h-0 overflow-y-auto p-4 sm:p-6',
            }"
        >
            <template #body>
                <LIGResultTableView
                    v-if="hasResults"
                    @focus="focusOnSelectedParcel"
                    @zoom="zoomToResults"
                />
            </template>
        </UModal>
    </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import bbox from "@turf/bbox";
import type { Feature } from "geojson";
import BaseSlideoverSidebarComponent from "../base/BaseSlideoverSidebarComponent.vue";
import LIGResultTableView from "./LIGResultTableView.vue";
import { downloadCSVFromGeoJSON } from "../../core/helpers/functions";
import { useMapStore } from "../../store/maplibre/map";
import { useResultStore } from "../../store/ligfinder/result";

type DownloadFormat = "geojson" | "csv";

const { t } = useI18n();
const mapStore = useMapStore();
const resultStore = useResultStore();
const sidebarID = "ligfinder-result-table";
const layerName = ref("");
const fileName = ref("");
const downloadFormat = ref<DownloadFormat>("geojson");
const isFullScreen = ref(false);
const highlightTimeout = ref<number>();
const currentHighlightId = ref(0);

const hasResults = computed(() => (resultStore.appliedFilterResult?.features.length ?? 0) > 0);
const downloadFormatOptions = computed(() => [
    { label: t("ligfinder.table.downloadGeoJSON"), value: "geojson" },
    { label: t("ligfinder.table.downloadCSV"), value: "csv" },
]);

function addAsLayer(): void {
    const sanitizedLayerName = layerName.value.replace(/[^a-zA-Z0-9-_]/g, "");
    resultStore.saveAsLayer(sanitizedLayerName);
}

function downloadResults(): void {
    const result = resultStore.appliedFilterResult;
    if (!result) return;

    if (downloadFormat.value === "csv") {
        downloadCSVFromGeoJSON(result, fileName.value);
        return;
    }

    const sanitizedFileName = fileName.value.replace(/[^a-zA-Z0-9-_]/g, "");
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result))}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
        "download",
        sanitizedFileName.length > 0 ? `${sanitizedFileName.trim()}.geojson` : "geojson-data.geojson",
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function zoomToResults(): void {
    if (!resultStore.appliedFilterResult) return;
    mapStore.map.fitBounds(bbox(resultStore.appliedFilterResult));
}

function focusOnSelectedParcel(parcel: Feature): void {
    mapStore.map.fitBounds(bbox(parcel), {
        padding: {
            top: 20,
            bottom: 200,
            left: 20,
            right: Math.min(560, Math.max(320, window.innerWidth * 0.46)),
        },
    });

    const tempSourceId = "highlight-source";
    const tempLayerId = "highlight-outline";
    const thisHighlightId = ++currentHighlightId.value;

    if (mapStore.map.getLayer(tempLayerId) !== undefined) {
        mapStore.map.removeLayer(tempLayerId);
    }
    if (mapStore.map.getSource(tempSourceId) !== undefined) {
        mapStore.map.removeSource(tempSourceId);
    }

    mapStore.map.addSource(tempSourceId, {
        type: "geojson",
        data: parcel,
    });
    mapStore.map.addLayer({
        id: tempLayerId,
        type: "line",
        source: tempSourceId,
        paint: {
            "line-color": "#000000",
            "line-width": 4,
            "line-opacity": 1,
        },
    });

    if (highlightTimeout.value != null) window.clearTimeout(highlightTimeout.value);
    highlightTimeout.value = window.setTimeout(() => {
        if (currentHighlightId.value !== thisHighlightId) return;
        if (mapStore.map.getLayer(tempLayerId) !== undefined) {
            mapStore.map.removeLayer(tempLayerId);
        }
        if (mapStore.map.getSource(tempSourceId) !== undefined) {
            mapStore.map.removeSource(tempSourceId);
        }
    }, 15000);
}
</script>
